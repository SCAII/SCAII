use specs::prelude::*;
use engine::resources::{SkyCollisionWorld, UnitTypeMap};
use engine::components::{AttackSensor, CollisionHandle, FactionId, Pos,
                         UnitTypeTag};

#[derive(SystemData)]
pub struct RedoCollisionSysData<'a> {
    tag: ReadStorage<'a, UnitTypeTag>,
    pos: ReadStorage<'a, Pos>,
    ids: Entities<'a>,
    faction: ReadStorage<'a, FactionId>,
    c_handle: WriteStorage<'a, CollisionHandle>,
    atk_radius: WriteStorage<'a, AttackSensor>,

    u_types: Fetch<'a, UnitTypeMap>,

    col_world: FetchMut<'a, SkyCollisionWorld>,
}

pub struct RedoCollisionSys;

impl<'a> System<'a> for RedoCollisionSys {
    type SystemData = RedoCollisionSysData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        let c_world = &mut *sys_data.col_world;
        let type_map = &*sys_data.u_types;

        for (pos, tag, faction, id) in (
            &sys_data.pos,
            &sys_data.tag,
            &sys_data.faction,
            &*sys_data.ids,
        ).join()
        {
            let u_type = type_map.tag_map.get(&tag.0).unwrap();

            u_type.register_collision(
                id,
                *pos,
                faction.0,
                &mut sys_data.c_handle,
                &mut sys_data.atk_radius,
                c_world,
            );
        }

        c_world.update();
    }
}
