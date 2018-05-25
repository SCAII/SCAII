mod component_impls;
pub mod de;
pub mod de_collision;
pub mod ser;

pub use self::de::DeserializeSystem;
pub use self::de_collision::RedoCollisionSys;
pub use self::ser::SerializeSystem;

use engine::components::{
    Attack, Color, ContactStates, DataStoreComponent, FactionId, Hp, Movable, Move, Owner, Pos,
    SensorRadius, SensorType, Sensors, Shape, Speed, UnitTypeTag,
};
use engine::resources::{CumReward, DataStore, LuaPath, SpawnBuffer, Terminal};
use rand::Isaac64Rng;

#[derive(Serialize, Deserialize, Debug)]
struct SerTarget {
    components: Vec<u8>,
    lua_path: LuaPath,
    rng: Isaac64Rng,
    terminal: Terminal,
    #[serde(default)]
    spawns: SpawnBuffer,
    #[serde(default)]
    cum_reward: CumReward,
    #[serde(default)]
    lua_data: DataStore,
}

type SerComponents = (
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
    Owner,
);
