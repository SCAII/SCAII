use std::collections::{HashMap, HashSet};

use super::FactionId;
use super::components::{AttackSensor, CollisionHandle, Color, Hp, Pos, Shape};

use scaii_defs::protos::{Action, State, Viz};

use specs::prelude::*;

pub mod collision;

pub use self::collision::*;

// Recommended by ncollide
pub const COLLISION_MARGIN: f64 = 0.02;
// ncollide wants the average size of a collider to be "around" 1
// we should probably set this as a resource from Lua in the future
pub const COLLISION_SCALE: f64 = 5.0;

pub const MAX_FACTIONS: usize = 15;

pub const STATE_SIZE: usize = 40;
pub const STATE_SCALE: usize = 1;

lazy_static! {
    pub static ref PLAYER_COLORS: Vec<Color> = vec![
        Color { r: 255, g: 0, b: 0 },
        Color { r: 0, g: 0, b: 255 },
        Color { r: 0, g: 255, b: 0 },
    ];
}

// 60FPS emulation since we're not
// actually measuring time elapsed
const SIXTY_FPS: f64 = 1.0 / 60.0;

pub(super) fn register_world_resources(world: &mut World) {
    use util;
    use specs::saveload::U64MarkerAllocator;
    use ndarray::Array3;

    let rng = util::make_rng();
    world.add_resource(rng);
    world.add_resource(Episode(0));
    world.add_resource(Terminal(false));
    world.add_resource(DeltaT(SIXTY_FPS));
    world.add_resource(Render::default());
    world.add_resource(NeedsKeyInfo(true));
    world.add_resource::<Vec<Player>>(Vec::new());
    world.add_resource(UnitTypeMap::default());
    world.add_resource(U64MarkerAllocator::new());
    world.add_resource(ActionInput::default());
    world.add_resource(SkyCollisionWorld::new(COLLISION_MARGIN));
    world.add_resource(RtsState(State {
        features: Array3::zeros([STATE_SIZE, STATE_SIZE, 4]).into_raw_vec(),
        feature_array_dims: vec![STATE_SIZE as u32, STATE_SIZE as u32, 4],
        ..Default::default()
    }));
    world.add_resource(Reward::default());
    world.add_resource(Skip(false, None));
    world.add_resource(SerializeBytes::default());
    world.add_resource(LuaPath(None));
    world.add_resource(RewardTypes::default());
}

#[derive(Default, Debug, Clone, PartialEq)]
pub struct RtsState(pub State);

/// The current episode, only meaningful for sequential runs.
#[derive(Copy, Clone, PartialEq, Eq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub struct Episode(pub usize);

/// Is this the final frame of the scenario?
#[derive(Copy, Clone, PartialEq, Eq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub struct Terminal(pub bool);

/// Time since the last update, in seconds (fixed to one sixtieth of a second for our purposes).
#[derive(Copy, Clone, PartialEq, PartialOrd, Serialize, Deserialize)]
pub struct DeltaT(pub f64);

/// Any associated data with various game factions.
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Player {
    pub color: super::components::Color,
    pub id: FactionId,
}

/// The output of the renderer, for use with Viz.
#[derive(Clone, PartialEq, Default)]
pub struct Render(pub Viz);

/// Tracks whether a FULL rerender (or total state, or whatever else)
/// is needed rather than a delta.
#[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash, Default, Debug)]
pub struct NeedsKeyInfo(pub bool);

/// The actions coming from the Agent (or replay mechanism)
#[derive(Clone, PartialEq, Default, Debug)]
pub struct ActionInput(pub Option<Action>);

#[derive(PartialEq, Default, Clone)]
pub struct Reward(pub HashMap<String, f64>);

#[derive(Eq, PartialEq, Default, Clone, Debug, Hash)]
pub struct Skip(pub bool, pub Option<String>);

#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
pub struct UnitType {
    pub tag: String,
    pub max_hp: f64,
    pub movable: bool,
    pub shape: Shape,
    pub kill_reward: f64,
    pub death_penalty: f64,
    pub damage_deal_reward: Option<f64>,
    pub damage_recv_penalty: Option<f64>,
    pub speed: f64,
    pub attack_range: f64,
    pub attack_damage: f64,
    pub attack_delay: f64,

    pub death_type: String,
    pub dmg_recv_type: String,
    pub dmg_deal_type: String,
    pub kill_type: String,
}

impl Default for UnitType {
    fn default() -> Self {
        UnitType {
            tag: "".to_string(),
            max_hp: 100.0,
            movable: true,
            shape: Shape::Triangle { base_len: 10.0 },
            kill_reward: 0.0,
            death_penalty: 0.0,
            damage_deal_reward: None,
            damage_recv_penalty: None,
            death_type: "death".to_string(),
            dmg_recv_type: "dmg_recvd".to_string(),
            dmg_deal_type: "dmg_dealt".to_string(),
            kill_type: "kill".to_string(),
            speed: 20.0,
            attack_range: 10.0,
            attack_delay: 1.0,
            attack_damage: 10.0,
        }
    }
}

impl UnitType {
    /// Creates and places the unit in the game world given its initial
    /// position and faction.
    ///
    /// This also initializes anything it needs such as colliders in the collision system.
    pub fn build_entity(&self, world: &mut World, pos: Pos, faction: usize) {
        use specs::saveload::U64Marker;

        use engine::components::{AttackSensor, CollisionHandle, Movable, Speed, Static,
                                 UnitTypeTag};

        let color = { world.read_resource::<Vec<Player>>()[faction].color };

        // Scoping for borrow shenanigans
        let entity = {
            let entity = world
                .create_entity()
                .with(pos)
                .with(self.shape)
                .with(color)
                .with(FactionId(faction))
                .with(UnitTypeTag(self.tag.clone()))
                .with(Hp {
                    max_hp: self.max_hp,
                    curr_hp: self.max_hp,
                })
                .marked::<U64Marker>();

            if self.movable {
                entity.with(Movable).with(Speed(self.speed))
            } else {
                entity.with(Static)
            }
        }.build();

        let col_storage = world.write::<CollisionHandle>();

        let atk_storage = world.write::<AttackSensor>();

        let c_world = &mut *world.write_resource();

        self.register_collision(entity, pos, faction, col_storage, atk_storage, c_world)
    }

    /// Registers a unit with the collision system based on its unit type
    /// and places the collision system handles into the appropriate components
    pub fn register_collision(
        &self,
        entity: Entity,
        pos: Pos,
        faction: usize,
        mut col_storage: WriteStorage<CollisionHandle>,
        mut atk_storage: WriteStorage<AttackSensor>,
        c_world: &mut SkyCollisionWorld,
    ) {
        use ncollide::shape::{Ball, Cuboid, Cylinder, ShapeHandle};
        use ncollide::world::{CollisionGroups, GeometricQueryType};
        use nalgebra::{Isometry2, Vector2};
        use nalgebra;

        let mut collider_group = CollisionGroups::new();
        collider_group.modify_membership(faction, true);

        let mut sensor_group = CollisionGroups::new();
        sensor_group.modify_membership(MAX_FACTIONS + faction, true);
        // sensor_group.set_blacklist(&SENSOR_BLACKLIST);

        let (collider, atk_radius) = match self.shape {
            Shape::Rect { width, height } => {
                let width = width / COLLISION_SCALE;
                let height = height / COLLISION_SCALE;

                // ncollide likes half widths and heights, so divide by 2
                let collider = Cuboid::new(Vector2::new(width / 2.0, height / 2.0));
                let collider = ShapeHandle::new(collider);

                let atk_radius = width.max(height) + (self.attack_range / COLLISION_SCALE);
                let atk_sensor = Ball::new(atk_radius);
                let atk_sensor = ShapeHandle::new(atk_sensor);

                (collider, atk_sensor)
            }
            Shape::Triangle { base_len } => {
                let base_len = base_len / COLLISION_SCALE;

                // equilateral triangle dimensions
                let half_height = base_len / (2.0 as f64).sqrt() / 2.0;
                let radius = base_len / 2.0;

                // A cylinder in 2D is an isoscelese triangle in ncollide
                let collider = Cylinder::new(half_height, radius);
                let collider = ShapeHandle::new(collider);

                let atk_radius = half_height + (self.attack_range / COLLISION_SCALE);
                let atk_sensor = Ball::new(atk_radius);
                let atk_sensor = ShapeHandle::new(atk_sensor);

                (collider, atk_sensor)
            }
        };

        // We need the entity ID for this, so do it after building the entity and then add the component.
        let (collider, atk_radius) = {
            let pos = Isometry2::new(
                Vector2::new(pos.x / COLLISION_SCALE, pos.y / COLLISION_SCALE),
                nalgebra::zero(),
            );

            let q_type = GeometricQueryType::Contacts(0.0, 0.0);
            let collider = c_world.add(
                pos,
                collider,
                collider_group,
                q_type,
                ColliderData {
                    e: entity,
                    detector: false,
                },
            );

            let atk_radius = c_world.add(
                pos,
                atk_radius,
                sensor_group,
                q_type,
                ColliderData {
                    e: entity,
                    detector: true,
                },
            );

            (collider, atk_radius)
        };

        col_storage.insert(entity, CollisionHandle(collider));
        atk_storage.insert(entity, AttackSensor(atk_radius));
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct UnitTypeMap {
    pub typ_ids: HashMap<String, usize>,
    pub tag_map: HashMap<String, UnitType>,
}

#[derive(Clone, Debug, PartialEq, Eq, Default)]
pub struct SerializeBytes(pub Vec<u8>);

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, Debug)]
pub struct LuaPath(pub Option<String>);

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, Debug)]
pub struct RewardTypes(pub HashSet<String>);

impl Default for RewardTypes {
    fn default() -> Self {
        let mut map = HashSet::new();
        map.insert("death".to_string());
        map.insert("kill".to_string());
        map.insert("dmg_dealt".to_string());
        map.insert("dmg_recvd".to_string());
        map.insert("victory".to_string());
        map.insert("defeat".to_string());

        RewardTypes(map)
    }
}
