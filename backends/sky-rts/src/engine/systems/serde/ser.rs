use specs::prelude::*;
// use specs::error::NoError;
use specs::saveload::{U64Marker, WorldSerialize};

use specs::error::NoError;

use super::SerComponents;
use engine::resources::{
    CumReward, DataStore, LuaPath, SerializeBytes, SpawnBuffer, Terminal, WorldRng,
};

#[derive(SystemData)]
pub struct SerializeSystemData<'a> {
    entities: Entities<'a>,
    markers: WriteStorage<'a, U64Marker>,
    alloc: Write<'a, U64MarkerAllocator>,

    components: DeserComponents<'a>,

    rng: Write<'a, WorldRng>,
    lua_path: Read<'a, LuaPath>,
    terminal: Read<'a, Terminal>,
    spawns: Read<'a, SpawnBuffer>,
    cum_reward: Read<'a, CumReward>,
    lua_data: Read<'a, DataStore>,

    out: Write<'a, SerializeBytes>,
}

pub struct SerializeSystem;

impl<'a> System<'a> for SerializeSystem {
    type SystemData = SerializeSystemData<'a>;

    fn run(&mut self, mut world: Self::SystemData) {
        use super::SerTarget;
        use serde::Serialize;
        use serde_cbor::Serializer;

        let out = &mut world.out.0;

        out.clear();

        let mut tar = Serializer::new(vec![]);
        world
            .components
            .serialize(&*world.entities, &mut world.markers, &mut *world.alloc)
            .expect("Could not serialize components");
        let tar = tar.into_inner();

        let tar = SerTarget {
            components: tar,
            lua_path: world.lua_path.clone(),
            rng: world.rng.clone(),
            spawns: world.spawns.clone(),
            terminal: *world.terminal,
            cum_reward: world.cum_reward.clone(),
            lua_data: world.lua_data.clone(),
        };

        let mut out = Serializer::new(out);

        tar.serialize(&mut out)
            .expect("Could not serialize resources");
    }
}
