pub mod ser;
pub mod de;

pub use self::ser::SerializeSystem;
pub use self::de::DeserializeSystem;

use engine::resources::LuaPath;
use rand::Isaac64Rng;

#[derive(Serialize, Deserialize, Debug)]
struct SerTarget {
    components: Vec<u8>,
    lua_path: LuaPath,
    rng: Isaac64Rng,
}
