use engine::components::Spawned;
use engine::resources::{Deserializing, Player, SkyCollisionWorld, SpawnBuffer, UnitTypeMap};
use specs::prelude::*;

#[derive(SystemData)]
pub struct SpawnSystemData<'a> {
    deserializing: Fetch<'a, Deserializing>,
    lazy_update: Fetch<'a, LazyUpdate>,
    spawn_buf: FetchMut<'a, SpawnBuffer>,
    type_map: Fetch<'a, UnitTypeMap>,
    players: Fetch<'a, Vec<Player>>,
    entities: Entities<'a>,
}

#[derive(Default)]
pub struct SpawnSystem {
    spawn_buf_bak: SpawnBuffer,
}

impl<'a> System<'a> for SpawnSystem {
    type SystemData = SpawnSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        use std::mem;

        // Skip this if we're deserializing because
        // we need to run the output systems at the end
        // but don't want to accidentally get spawn counters
        // out of sync
        if sys_data.deserializing.0 {
            return;
        }

        // borrow checker workaround
        let (lazy_update, entities, type_map, players, spawn_buf) = (
            &*sys_data.lazy_update,
            &*sys_data.entities,
            &*sys_data.type_map,
            &*sys_data.players,
            &mut *sys_data.spawn_buf,
        );

        let buf_len = spawn_buf.0.len();

        // We're basically just "pouring" one bucket into another through a mesh
        //
        // If the delay suggests we should spawn the entity now, we don't put it in
        // the backup buffer, and instead spawn it. Otherwise we just decrease the time
        // and let it naturally filter into the backup buffer
        self.spawn_buf_bak
            .0
            .extend(spawn_buf.0.drain(..).filter_map(|mut spawn| {
                if spawn.delay <= 1 {
                    let u_type = type_map.tag_map.get(&spawn.u_type).expect(&format!(
                        "Unknown unit type {} at spawn of {:?}",
                        spawn.u_type, spawn,
                    ));

                    let build = lazy_update.create_entity(entities);

                    let entity = u_type.build_entity_lazy(
                        build,
                        &*lazy_update,
                        spawn.pos,
                        spawn.curr_hp,
                        spawn.faction,
                        &*players,
                    );
                    lazy_update.insert(entity, Spawned);

                    None
                } else {
                    spawn.delay -= 1;
                    Some(spawn)
                }
            }));

        let new_len = self.spawn_buf_bak.0.len();

        // If we have fewer elements, we did some spawns and also have to cue up a world update for collision
        // purposes
        if new_len < buf_len {
            lazy_update.execute(|world| {
                world.write_resource::<SkyCollisionWorld>().update();
            });
        }

        mem::swap(spawn_buf, &mut self.spawn_buf_bak);
    }
}
