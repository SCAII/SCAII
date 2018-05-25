use specs::prelude::*;
// use specs::error::NoError;
use specs::saveload::{U64Marker, WorldDeserialize};

use specs::error::NoError;

use engine::resources::{
    CumReward, DataStore, LuaPath, SerializeBytes, SpawnBuffer, Terminal, WorldRng,
};

#[derive(SystemData)]
pub struct DeserializeSystemData<'a> {
    de: WorldDeserialize<'a, U64Marker, NoError, super::SerComponents>,

    rng: Write<'a, WorldRng>,
    lua_path: Write<'a, LuaPath>,
    terminal: Write<'a, Terminal>,
    spawns: Write<'a, SpawnBuffer>,
    cum_reward: Write<'a, CumReward>,
    lua_data: Write<'a, DataStore>,

    decode: Read<'a, SerializeBytes>,
}

pub struct DeserializeSystem;

impl<'a> System<'a> for DeserializeSystem {
    type SystemData = DeserializeSystemData<'a>;

    fn run(&mut self, mut world: Self::SystemData) {
        use super::SerTarget;
        use serde::de::DeserializeSeed;
        use serde::Deserialize;
        use serde_cbor::de::SliceRead;
        use serde_cbor::Deserializer;

        let mut de = Deserializer::new(SliceRead::new(&world.decode.0));

        let tar = SerTarget::deserialize(&mut de).unwrap();
        de.end().unwrap();

        let mut de = Deserializer::new(SliceRead::new(&tar.components));
        world.de.deserialize(&mut de).unwrap();
        de.end().unwrap();

        *world.lua_path = tar.lua_path;
        *world.rng = tar.rng;
        *world.terminal = tar.terminal;
        *world.spawns = tar.spawns;
        *world.cum_reward = tar.cum_reward;
        *world.lua_data = tar.lua_data;
    }
}
