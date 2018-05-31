#[doc(hidden)]
pub mod component_impls;
pub mod de;
pub mod de_collision;
pub mod ser;

pub(crate) use self::de::DeserializeSystem;
pub(crate) use self::de_collision::RedoCollisionSys;
pub(crate) use self::ser::SerializeSystem;

use specs::prelude::*;

use engine::components::{
    Attack, Color, ContactStates, DataStoreComponent, FactionId, Hp, Movable, Move, Owner, Pos,
    SensorRadius, SensorType, Sensors, Shape, Speed, UnitTypeTag,
};
use engine::resources::{CumReward, DataStore, LuaPath, SpawnBuffer, Terminal, WorldRng};
use rand::Isaac64Rng;

saveload_components!{
    [
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
    ],
    De,
    Ser,
    Data
}

#[derive(Serialize, Deserialize, Debug, Default)]
struct SerTarget {
    rng: WorldRng,
    terminal: Terminal,
    lua_path: LuaPath,
    lua_data: DataStore,
    cum_reward: CumReward,
    spawns: SpawnBuffer,
    components: Vec<u8>,
}

use self::saveload_generated::{De, Ser};
