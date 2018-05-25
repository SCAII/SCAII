use specs::prelude::*;

use specs::saveload::{DeserializeComponents, U64Marker, U64MarkerAllocator};

use specs::error::NoError;

use engine::resources::{
    CumReward, DataStore, LuaPath, SerializeBytes, SpawnBuffer, Terminal, WorldRng,
};

use super::DeserComponents;

#[derive(SystemData)]
pub struct DeserializeSystemData<'a> {
    entities: Entities<'a>,
    markers: WriteStorage<'a, U64Marker>,
    alloc: Write<'a, U64MarkerAllocator>,

    components: DeserComponents<'a>,

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

        DeserializeComponents::deserialize(
            &mut world.components,
            &*world.entities,
            &mut world.markers,
            &mut *world.alloc,
            &mut de,
        );
        de.end().unwrap();

        *world.lua_path = tar.lua_path;
        *world.rng = tar.rng;
        *world.terminal = tar.terminal;
        *world.spawns = tar.spawns;
        *world.cum_reward = tar.cum_reward;
        *world.lua_data = tar.lua_data;

        world.markers.clear();
    }
}
