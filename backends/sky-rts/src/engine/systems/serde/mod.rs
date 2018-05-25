mod component_impls;
pub mod de;
pub mod de_collision;
pub mod ser;

pub use self::de::DeserializeSystem;
pub use self::de_collision::RedoCollisionSys;
pub use self::ser::SerializeSystem;

use specs::prelude::*;

use engine::components::{
    Attack, Color, ContactStates, DataStoreComponent, FactionId, Hp, Movable, Move, Owner, Pos,
    SensorRadius, SensorType, Sensors, Shape, Speed, UnitTypeTag,
};
use engine::resources::{CumReward, DataStore, LuaPath, SpawnBuffer, Terminal, WorldRng};
use rand::Isaac64Rng;

macro_rules! serde_comp {
    ( $( $x:ty ),* ) => {
        #[derive(SystemData)]
        struct SerComponents<'a>(
            $(ReadStorage<'a, $x>,)*
        );

        #[derive(SystemData)]
        struct DeserComponents<'a>(
            $(WriteStorage<'a, $x>,)*
        );
    };
}

#[derive(Serialize, Deserialize, Debug)]
struct SerTarget {
    components: Vec<u8>,
    lua_path: LuaPath,
    rng: WorldRng,
    terminal: Terminal,
    #[serde(default)]
    spawns: SpawnBuffer,
    #[serde(default)]
    cum_reward: CumReward,
    #[serde(default)]
    lua_data: DataStore,
}

serde_comp!(
    Speed,
    Movable,
    Move,
    Pos,
    Hp,
    Color,
    Shape,
    FactionId,
    Attack,
    UnitTypeTag,
    DataStoreComponent,
    ContactStates,
    Sensors,
    SensorType,
    SensorRadius,
    Owner
);

// #[derive(SystemData)]
// struct SerComponents<'a>(
//     ReadStorage<'a, Speed>,
//     ReadStorage<'a, Movable>,
//     ReadStorage<'a, Move>,
//     ReadStorage<'a, Pos>,
//     ReadStorage<'a, Hp>,
//     ReadStorage<'a, Color>,
//     ReadStorage<'a, Shape>,
//     ReadStorage<'a, FactionId>,
//     ReadStorage<'a, Attack>,
//     ReadStorage<'a, UnitTypeTag>,
//     ReadStorage<'a, DataStoreComponent>,
//     ReadStorage<'a, ContactStates>,
//     ReadStorage<'a, Sensors>,
//     ReadStorage<'a, SensorType>,
//     ReadStorage<'a, SensorRadius>,
//     ReadStorage<'a, Owner>,
// );

// #[derive(SystemData)]
// struct DeserComponents<'a>(
//     WriteStorage<'a, Speed>,
//     WriteStorage<'a, Movable>,
//     WriteStorage<'a, Move>,
//     WriteStorage<'a, Pos>,
//     WriteStorage<'a, Hp>,
//     WriteStorage<'a, Color>,
//     WriteStorage<'a, Shape>,
//     WriteStorage<'a, FactionId>,
//     WriteStorage<'a, Attack>,
//     WriteStorage<'a, UnitTypeTag>,
//     WriteStorage<'a, DataStoreComponent>,
//     WriteStorage<'a, ContactStates>,
//     WriteStorage<'a, Sensors>,
//     WriteStorage<'a, SensorType>,
//     WriteStorage<'a, SensorRadius>,
//     WriteStorage<'a, Owner>,
// );
