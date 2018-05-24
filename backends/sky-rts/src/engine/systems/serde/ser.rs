use specs::prelude::*;
// use specs::error::NoError;
use specs::saveload::{U64Marker, WorldSerialize};

use specs::error::NoError;

use rand::Isaac64Rng;

use engine::resources::{CumReward, DataStore, LuaPath, SerializeBytes, SpawnBuffer, Terminal};

#[derive(SystemData)]
pub struct SerializeSystemData<'a> {
    ser: WorldSerialize<'a, U64Marker, NoError, super::SerComponents>,

    rng: Write<'a, Isaac64Rng>,
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
            .ser
            .serialize(&mut tar)
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
