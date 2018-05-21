pub mod de;
pub mod de_collision;
pub mod ser;

pub use self::de::DeserializeSystem;
pub use self::de_collision::RedoCollisionSys;
pub use self::ser::SerializeSystem;

use engine::components::{Attack, Color, DataStoreComponent, FactionId, Hp, Movable, Move, Pos,
                         Shape, Speed, Static, UnitTypeTag};
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
    Static,
    Move,
    Pos,
    Hp,
    Color,
    Shape,
    FactionId,
    Attack,
    UnitTypeTag,
    DataStoreComponent,
);
