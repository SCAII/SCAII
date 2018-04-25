use std::error::Error;

use specs::prelude::*;
use specs::saveload::{U64Marker, WorldSerialize};

use specs::error::NoError;

use rand::Isaac64Rng;

use engine::resources::{LuaPath, SerError, SerializeBytes, SpawnBuffer, Terminal};

#[derive(SystemData)]
pub struct SerializeSystemData<'a> {
    ser: WorldSerialize<'a, U64Marker, NoError, super::SerComponents>,

    rng: FetchMut<'a, Isaac64Rng>,
    lua_path: Fetch<'a, LuaPath>,
    terminal: Fetch<'a, Terminal>,
    spawns: Fetch<'a, SpawnBuffer>,

    // TODO: maybe make this a Result<Bytes,Error>
    ser_error: FetchMut<'a, SerError>,
    out: FetchMut<'a, SerializeBytes>,
}

pub struct SerData<'a> {
    ser: WorldSerialize<'a, U64Marker, NoError, super::SerComponents>,

    rng: FetchMut<'a, Isaac64Rng>,
    lua_path: Fetch<'a, LuaPath>,
    terminal: Fetch<'a, Terminal>,
    spawns: Fetch<'a, SpawnBuffer>,

    out: FetchMut<'a, SerializeBytes>,
}

pub struct SerializeSystem;

impl SerializeSystem {
    fn error_wrap(&mut self, mut world: SerData) -> Result<(), Box<Error>> {
        use serde_cbor::Serializer;
        use serde::Serialize;
        use super::SerTarget;

        let out = &mut world.out.0;

        out.clear();

        let mut tar = Serializer::new(vec![]);
        world.ser.serialize(&mut tar)?;
        let tar = tar.into_inner();

        let tar = SerTarget {
            components: tar,
            lua_path: world.lua_path.clone(),
            rng: world.rng.clone(),
            spawns: world.spawns.clone(),
            terminal: *world.terminal,
        };

        let mut out = Serializer::new(out);

        tar.serialize(&mut out)?;

        Ok(())
    }
}

impl<'a> System<'a> for SerializeSystem {
    type SystemData = SerializeSystemData<'a>;

    fn run(&mut self, mut world: Self::SystemData) {
        let ser_data = SerData {
            ser: world.ser,

            rng: world.rng,
            lua_path: world.lua_path,
            terminal: world.terminal,
            spawns: world.spawns,

            out: world.out,
        };
        let result = self.error_wrap(ser_data);
        world.ser_error.0 = result.map_err(|e| format!("{}", e));
    }
}
