use std::error::Error;

use specs::prelude::*;
use specs::saveload::{U64Marker, WorldDeserialize};
use specs::error::NoError;

use rand::Isaac64Rng;

use sky_rts::engine::resources::{LuaPath, SerError, SerializeBytes, Terminal};

#[derive(SystemData)]
pub struct DeserializeSystemData<'a> {
    de: WorldDeserialize<'a, U64Marker, NoError, super::SerComponents>,

    rng: FetchMut<'a, Isaac64Rng>,
    lua_path: FetchMut<'a, LuaPath>,
    terminal: FetchMut<'a, Terminal>,
    ser_error: FetchMut<'a, SerError>,

    decode: Fetch<'a, SerializeBytes>,
}

struct DeserData<'a> {
    de: WorldDeserialize<'a, U64Marker, NoError, super::SerComponents>,

    rng: FetchMut<'a, Isaac64Rng>,
    lua_path: FetchMut<'a, LuaPath>,
    terminal: FetchMut<'a, Terminal>,

    decode: Fetch<'a, SerializeBytes>,
}

pub struct DeserializeSystem;

impl DeserializeSystem {
    fn error_wrap(&mut self, mut world: DeserData) -> Result<(), Box<Error>> {
        use super::SerTarget;
        use serde::Deserialize;
        use serde::de::DeserializeSeed;
        use serde_cbor::Deserializer;
        use serde_cbor::de::SliceRead;

        let mut de = Deserializer::new(SliceRead::new(&world.decode.0));

        let tar = SerTarget::deserialize(&mut de)?;
        de.end()?;

        let mut de = Deserializer::new(SliceRead::new(&tar.components));
        world.de.deserialize(&mut de)?;
        de.end()?;

        *world.lua_path = tar.lua_path;
        *world.rng = tar.rng;
        *world.terminal = tar.terminal;

        Ok(())
    }
}

impl<'a> System<'a> for DeserializeSystem {
    type SystemData = DeserializeSystemData<'a>;

    fn run(&mut self, mut world: Self::SystemData) {
        let deser_data = DeserData {
            de: world.de,
            rng: world.rng,
            lua_path: world.lua_path,
            decode: world.decode,
            terminal: world.terminal,
        };
        let result = self.error_wrap(deser_data);
        world.ser_error.0 = result.map_err(|e| format!("{}", e));
    }
}
