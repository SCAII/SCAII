use specs::prelude::*;
// use specs::error::NoError;
use specs::saveload::{U64Marker, WorldDeserialize};

use specs::error::NoError;

use rand::Isaac64Rng;

use engine::resources::{LuaPath, SerializeBytes};

#[derive(SystemData)]
pub struct DeserializeSystemData<'a> {
    de: WorldDeserialize<'a, U64Marker, NoError, super::SerComponents>,

    rng: FetchMut<'a, Isaac64Rng>,
    lua_path: FetchMut<'a, LuaPath>,

    decode: Fetch<'a, SerializeBytes>,
}

pub struct DeserializeSystem;

impl<'a> System<'a> for DeserializeSystem {
    type SystemData = DeserializeSystemData<'a>;

    fn run(&mut self, mut world: Self::SystemData) {
        use super::SerTarget;
        use serde::Deserialize;
        use serde::de::DeserializeSeed;
        use serde_cbor::Deserializer;
        use serde_cbor::de::SliceRead;

        let mut de = Deserializer::new(SliceRead::new(&world.decode.0));

        let tar = SerTarget::deserialize(&mut de).unwrap();
        de.end().unwrap();

        let mut de = Deserializer::new(SliceRead::new(&tar.components));
        world.de.deserialize(&mut de).unwrap();
        de.end().unwrap();

        *world.lua_path = tar.lua_path;
        *world.rng = tar.rng;
    }
}
