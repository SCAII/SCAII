use std::collections::{HashMap, HashSet};

use super::FactionId;
use engine::components::Color;

use scaii_defs::protos::{Action, State, Viz};

use specs::prelude::*;

pub mod collision;
mod unit_type;

pub use self::{collision::*, unit_type::*};
pub use engine::systems::lua::userdata::DataStore;

// Recommended by ncollide
pub const COLLISION_MARGIN: f64 = 0.02;
// ncollide wants the average size of a collider to be "around" 1
// we should probably set this as a resource from Lua in the future
pub const COLLISION_SCALE: f64 = 5.0;

pub const UNIVERSAL_SENSOR: usize = SENSOR_OFFSET + MAX_FACTIONS;
pub const SENSOR_OFFSET: usize = MAX_FACTIONS;
pub const SENSOR_BLACKLIST: [usize; MAX_FACTIONS + 1] = [
    SENSOR_OFFSET,
    SENSOR_OFFSET + 1,
    SENSOR_OFFSET + 2,
    SENSOR_OFFSET + 3,
    UNIVERSAL_SENSOR,
];

pub const MAX_FACTIONS: usize = 4;

pub const STATE_SIZE: usize = 40;
pub const STATE_SCALE: usize = 1;

lazy_static! {
    pub static ref PLAYER_COLORS: Vec<Color> = vec![
        Color {
            r: 255,
            g: 181,
            b: 0,
        },
        Color { r: 255, g: 0, b: 0 },
        Color { r: 0, g: 0, b: 255 },
    ];
}

// 60FPS emulation since we're not
// actually measuring time elapsed
const SIXTY_FPS: f64 = 1.0 / 60.0;

pub(super) fn register_world_resources(world: &mut World) {
    use ndarray::Array3;
    use specs::saveload::U64MarkerAllocator;
    use util;

    let rng = util::make_rng();
    world.add_resource(rng);
    world.add_resource(Episode(0));
    world.add_resource(Terminal(false));
    world.add_resource(Step(0));
    world.add_resource(MaxStep(None));
    world.add_resource(DeltaT(SIXTY_FPS));
    world.add_resource(Render::default());
    world.add_resource(NeedsKeyInfo(true));
    world.add_resource::<Vec<Player>>(Vec::new());
    world.add_resource(UnitTypeMap::default());
    world.add_resource(U64MarkerAllocator::new());
    world.add_resource(ActionInput::default());
    world.add_resource(new_collision_world());

    world.add_resource(RtsState(State {
        features: Array3::zeros([STATE_SIZE, STATE_SIZE, 4]).into_raw_vec(),
        feature_array_dims: vec![STATE_SIZE as u32, STATE_SIZE as u32, 4],
        ..Default::default()
    }));

    world.add_resource(Reward::default());
    world.add_resource(Skip(false, None));
    world.add_resource(SerializeBytes::default());
    world.add_resource(LuaPath(None));
    world.add_resource(ReplayMode(false));
    world.add_resource(RewardTypes::default());
    world.add_resource(SpawnBuffer::default());
    world.add_resource(Deserializing(false));
    world.add_resource(CumReward::default());
    world.add_resource(DataStore::default());
}

#[derive(Default, Debug, Clone, PartialEq)]
pub struct RtsState(pub State);

/// The current episode, only meaningful for sequential runs.
#[derive(Copy, Clone, PartialEq, Eq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub struct Episode(pub usize);

#[derive(Copy, Clone, PartialEq, Eq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub struct Step(pub usize);

#[derive(Copy, Clone, PartialEq, Eq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub struct MaxStep(pub Option<usize>);

/// Is this the final frame of the scenario?
#[derive(Copy, Clone, PartialEq, Eq, Ord, PartialOrd, Hash, Debug, Serialize, Deserialize)]
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

#[derive(PartialEq, Default, Clone, Serialize, Deserialize, Debug)]
pub struct CumReward(pub HashMap<String, f64>);

#[derive(Eq, PartialEq, Default, Clone, Debug, Hash)]
pub struct Skip(pub bool, pub Option<String>);

#[derive(Clone, Debug, PartialEq, Eq, Default)]
pub struct SerializeBytes(pub Vec<u8>);

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, Debug)]
pub struct LuaPath(pub Option<String>);

#[derive(Copy, Clone, Eq, PartialEq, Default)]
pub struct ReplayMode(pub bool);

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

#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
pub struct Spawn {
    pub delay: u64,
    pub pos: super::components::Pos,
    pub curr_hp: Option<f64>,
    pub faction: usize,
    pub u_type: String,
}

#[derive(Clone, PartialEq, Debug, Default, Serialize, Deserialize)]
pub struct SpawnBuffer(pub Vec<Spawn>);

#[derive(Copy, Clone, PartialEq, Eq, Debug, Default)]
pub struct Deserializing(pub bool);
