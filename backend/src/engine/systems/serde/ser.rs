use specs::prelude::*;
// use specs::error::NoError;
use specs::saveload::{U64Marker, WorldSerialize};

use specs::error::NoError;

use rand::Isaac64Rng;

use engine::resources::{LuaPath, SerializeBytes};

use engine::components::{Attack, Color, FactionId, Hp, Movable, Move,
                         MovedFlag, Pos, Shape, Speed, Static, UnitTypeTag};

#[derive(SystemData)]
pub struct SerializeSystemData<'a> {
    ser: WorldSerialize<
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
            Color,
            Shape,
            FactionId,
            Attack,
            UnitTypeTag,
        ),
    >,

    rng: FetchMut<'a, Isaac64Rng>,
    lua_path: Fetch<'a, LuaPath>,

    out: FetchMut<'a, SerializeBytes>,
}

pub struct SerializeSystem;

impl<'a> System<'a> for SerializeSystem {
    type SystemData = SerializeSystemData<'a>;

    fn run(&mut self, mut world: Self::SystemData) {
        use bincode;
        use bincode::Infinite;
        use super::SerTarget;

        let out = &mut world.out.0;

        out.clear();

        let mut tar = vec![];

        bincode::serialize_into(&mut tar, &world.ser, Infinite).unwrap();

        let tar = SerTarget {
            components: tar,
            lua_path: world.lua_path.clone(),
            rng: world.rng.clone(),
        };

        bincode::serialize_into(out, &tar, Infinite).unwrap();
    }
}
