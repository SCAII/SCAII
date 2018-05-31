use specs::prelude::*;
// use specs::error::NoError;
use specs::saveload::{SerializeComponents, U64Marker};

use specs::error::NoError;

use super::{Ser, SerTarget};
use engine::resources::{
    CumReward, DataStore, LuaPath, SerializeBytes, SpawnBuffer, Terminal, WorldRng,
};

#[derive(SystemData)]
pub struct SerializeSystemData<'a> {
    ser: Ser<'a, U64Marker>,

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
        use serde::Serialize;
        use serde_cbor::Serializer;

        let out = &mut world.out.0;

        out.clear();

        let mut tar = Serializer::new(vec![]);
        SerializeComponents::serialize(
            &world.ser.components,
            &*world.ser.entities,
            &world.ser.markers,
            &mut tar,
        );

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
