use specs::prelude::*;
// use specs::error::NoError;
use specs::saveload::{U64Marker, WorldDeserialize};

use specs::error::NoError;

use rand::Isaac64Rng;

use engine::resources::{LuaPath, SerializeBytes};

use engine::components::{Attack, Color, Damage, FactionId, Hp, HpChangeFlag, Movable, Move,
                         MovedFlag, Pos, Shape, Speed, Static};

#[derive(SystemData)]
pub struct DeserializeSystemData<'a> {
    de: WorldDeserialize<
        'a,
        U64Marker,
        NoError,
        (
            Speed,
            Movable,
            Static,
            Move,
            Pos,
            MovedFlag,
            Hp,
            HpChangeFlag,
            Damage,
            Color,
            Shape,
            FactionId,
            Attack,
        ),
    >,

    rng: FetchMut<'a, Isaac64Rng>,
    lua_path: FetchMut<'a, LuaPath>,

    decode: Fetch<'a, SerializeBytes>,
}

pub struct DeserializeSystem;

impl<'a> System<'a> for DeserializeSystem {
    type SystemData = DeserializeSystemData<'a>;

    fn run(&mut self, mut world: Self::SystemData) {
        use bincode;
        use bincode::Infinite;
        use bincode::Deserializer;
        use bincode::read_types::SliceReader;
        use super::SerTarget;
        use serde::de::DeserializeSeed;

        let tar: SerTarget = bincode::deserialize(&world.decode.0).unwrap();

        let reader = SliceReader::new(&tar.components);

        let mut deserializer = Deserializer::new(reader, Infinite);

        world.de.deserialize(&mut deserializer).unwrap();

        *world.lua_path = tar.lua_path;
        *world.rng = tar.rng;
    }
}
