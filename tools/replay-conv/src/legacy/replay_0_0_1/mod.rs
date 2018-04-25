use sky_rts::engine::resources::{LuaPath, Terminal};
use sky_rts::engine::components::{Attack, Color, FactionId, Hp, Movable, Move, Pos, Shape, Speed,
                                  Static, UnitTypeTag};
use rand::Isaac64Rng;

pub mod de;
pub use self::de::DeserializeSystem;

#[derive(Serialize, Deserialize, Debug)]
pub struct SerTarget {
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
