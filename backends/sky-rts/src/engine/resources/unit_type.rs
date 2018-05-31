use engine::{
    components::{CollisionHandle, DataStoreComponent, Pos, Shape}, resources::SkyCollisionWorld,
};
use specs::prelude::*;

use std::collections::HashMap;

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
            kill_type: "killed_enemy".to_string(),
            speed: 20.0,
            attack_range: 10.0,
            attack_delay: 1.0,
            attack_damage: 10.0,
        }
    }
}

impl UnitType {
    pub fn build_entity(
        &self,
        world: &mut World,
        pos: Pos,
        curr_hp: Option<f64>,
        faction: usize,
    ) -> Entity {
        use engine::{
            components::{sensor, FactionId, Hp, Movable, SensorType, Sensors, Speed, UnitTypeTag},
            resources::PLAYER_COLORS,
        };
        use specs::saveload::{MarkedBuilder, U64Marker};

        let color = PLAYER_COLORS[faction];

        // Scoping for borrow shenanigans
        let entity = {
            let entity = world
                .create_entity()
                .with(pos)
                .with(self.shape)
                .with(color)
                .with(FactionId(faction))
                .with(UnitTypeTag(self.tag.clone()))
                .with(DataStoreComponent::default())
                .with(Hp {
                    max_hp: self.max_hp,
                    curr_hp: curr_hp.unwrap_or(self.max_hp),
                })
                .marked::<U64Marker>();

            if self.movable {
                entity.with(Movable(0)).with(Speed(self.speed))
            } else {
                entity
            }
        }.build();

        let me = {
            let mut col_storage = world.write_storage::<CollisionHandle>();
            let mut c_world = world.write_resource();

            self.register_collision(entity, pos, faction, &mut col_storage, &mut *c_world)
        };

        let atk_radius = self.shape.compute_extended_radius(self.attack_range);
        let atk_sensor = sensor::build_attack_sensor(world, me, atk_radius);
        world
            .write_storage::<Sensors>()
            .entry(me)
            .unwrap()
            .or_insert(Default::default())
            .0
            .insert(SensorType::Attack, atk_sensor);

        me
    }

    /// Registers a unit with the collision system based on its unit type
    /// and places the collision system handles into the appropriate components
    pub fn register_collision(
        &self,
        entity: Entity,
        pos: Pos,
        faction: usize,
        col_storage: &mut WriteStorage<CollisionHandle>,
        c_world: &mut SkyCollisionWorld,
    ) -> Entity {
        use engine::{
            components::Shape, resources::{ColliderData, COLLISION_SCALE},
        };
        use nalgebra;
        use nalgebra::{Isometry2, Vector2};
        use ncollide::{
            shape::{Ball, Cuboid, Cylinder, ShapeHandle},
            world::{CollisionGroups, GeometricQueryType},
        };

        let mut collider_group = CollisionGroups::new();
        collider_group.set_membership(&[faction]);

        let collider = match self.shape {
            Shape::Rect { width, height } => {
                let width = width / COLLISION_SCALE;
                let height = height / COLLISION_SCALE;

                // ncollide likes half widths and heights, so divide by 2
                let collider = Cuboid::new(Vector2::new(width / 2.0, height / 2.0));
                let collider = ShapeHandle::new(collider);

                collider
            }
            Shape::Triangle { base_len } => {
                let base_len = base_len / COLLISION_SCALE;

                // equilateral triangle dimensions
                let half_height = base_len / (2.0 as f64).sqrt() / 2.0;
                let radius = base_len / 2.0;

                // A cylinder in 2D is an isoscelese triangle in ncollide
                let collider = Cylinder::new(half_height, radius);
                let collider = ShapeHandle::new(collider);

                collider
            }
            Shape::Circle { radius } => ShapeHandle::new(Ball::new(radius / COLLISION_SCALE)),
        };

        // We need the entity ID for this, so do it after building the entity and then add the component.
        let pos = Isometry2::new(
            Vector2::new(pos.x / COLLISION_SCALE, pos.y / COLLISION_SCALE),
            nalgebra::zero(),
        );

        let q_type = GeometricQueryType::Contacts(0.0, 0.0);
        let collider = c_world.0.add(
            pos,
            collider,
            collider_group,
            q_type,
            ColliderData {
                e: entity,
                owner: None,
                sensor: false,
            },
        );

        col_storage.insert(entity, CollisionHandle(collider));

        entity
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct UnitTypeMap {
    pub typ_ids: HashMap<String, usize>,
    pub tag_map: HashMap<String, UnitType>,
}
