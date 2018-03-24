pub mod ser;
pub mod de;
pub mod de_collision;

pub use self::ser::SerializeSystem;
pub use self::de::DeserializeSystem;
pub use self::de_collision::RedoCollisionSys;

use engine::resources::{LuaPath, Terminal};
use engine::components::{Attack, Color, FactionId, Hp, Movable, Move, Pos, Shape, Speed, Static,
                         UnitTypeTag};
use rand::Isaac64Rng;

#[derive(Serialize, Deserialize, Debug)]
struct SerTarget {
    components: Vec<u8>,
    lua_path: LuaPath,
    rng: Isaac64Rng,
    terminal: Terminal,
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
