pub mod de;
pub mod de_collision;
pub mod ser;

pub use self::de::DeserializeSystem;
pub use self::de_collision::RedoCollisionSys;
pub use self::ser::SerializeSystem;

use engine::components::{
    Attack, Color, FactionId, Hp, Movable, Move, Pos, Shape, Speed, Static, UnitTypeTag,
};
use engine::resources::{CumReward, LuaPath, SpawnBuffer, Terminal};
use rand::Isaac64Rng;

#[derive(Serialize, Deserialize, Debug)]
struct SerTarget {
    components: Vec<u8>,
    lua_path: LuaPath,
    rng: Isaac64Rng,
    terminal: Terminal,
    spawns: SpawnBuffer,
    cum_reward: CumReward,
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
);
