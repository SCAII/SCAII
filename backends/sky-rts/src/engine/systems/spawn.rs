use engine::components::Spawned;
use engine::resources::{SpawnBuffer, UnitTypeMap};
use specs::prelude::*;

#[derive(Default)]
pub struct SpawnSystem {
    spawn_buf_bak: SpawnBuffer,
    spawn_buf_tmp: SpawnBuffer,
}

impl SpawnSystem {
    pub fn update(&mut self, world: &mut World) {
        use std::mem;

        self.spawn_buf_tmp.0.clear();

        // Need this for borrow checking or we're just borrowing world while we try to pass it
        // mutably
        mem::swap(
            &mut self.spawn_buf_tmp,
            &mut *world.write_resource::<SpawnBuffer>(),
        );

        // We're basically just "pouring" one bucket into another through a mesh
        //
        // If the delay suggests we should spawn the entity now, we don't put it in
        // the backup buffer, and instead spawn it. Otherwise we just decrease the time
        // and let it naturally filter into the backup buffer
        self.spawn_buf_bak
            .0
            .extend(self.spawn_buf_tmp.0.drain(..).filter_map(|mut spawn| {
                if spawn.delay <= 1 {
                    // really unfortunate but we need to clone for borrow checker
                    let u_type = world
                        .read_resource::<UnitTypeMap>()
                        .tag_map
                        .get(&spawn.u_type)
                        .expect(&format!(
                            "Unknown unit type {} at spawn of {:?}",
                            spawn.u_type, spawn,
                        ))
                        .clone();

                    let entity =
                        u_type.build_entity(world, spawn.pos, spawn.curr_hp, spawn.faction);

                    world.write::<Spawned>().insert(entity, Spawned);

                    None
                } else {
                    spawn.delay -= 1;
                    Some(spawn)
                }
            }));

        mem::swap(
            &mut *world.write_resource::<SpawnBuffer>(),
            &mut self.spawn_buf_bak,
        );
    }
}
