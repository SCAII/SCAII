use specs::prelude::*;
// use specs::error::NoError;
use specs::saveload::{U64Marker, WorldSerialize};

use specs::error::NoError;

use rand::Isaac64Rng;

use engine::resources::{LuaPath, SerializeBytes};

#[derive(SystemData)]
pub struct SerializeSystemData<'a> {
    ser: WorldSerialize<'a, U64Marker, NoError, super::SerComponents>,

    rng: FetchMut<'a, Isaac64Rng>,
    lua_path: Fetch<'a, LuaPath>,

    out: FetchMut<'a, SerializeBytes>,
}

pub struct SerializeSystem;

impl<'a> System<'a> for SerializeSystem {
    type SystemData = SerializeSystemData<'a>;

    fn run(&mut self, mut world: Self::SystemData) {
        use serde_cbor::Serializer;
        use serde::Serialize;
        use super::SerTarget;

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
        };

        let mut out = Serializer::new(out);

        tar.serialize(&mut out)
            .expect("Could not serialize resources");
    }
}
