use specs::prelude::*;
use engine::components::{AttackSensor, CollisionHandle, DealtDamage, Death, HpChange, MovedFlag};
use engine::resources::SkyCollisionWorld;

#[derive(SystemData)]
pub struct CleanupSystemData<'a> {
    death: WriteStorage<'a, Death>,
    moved: WriteStorage<'a, MovedFlag>,
    dealt_dmg: WriteStorage<'a, DealtDamage>,
    hp_change: WriteStorage<'a, HpChange>,
    entities: Entities<'a>,
    collision_sys: FetchMut<'a, SkyCollisionWorld>,

    col_handle: ReadStorage<'a, CollisionHandle>,
    atk_radius: ReadStorage<'a, AttackSensor>,
}

pub struct CleanupSystem;

impl<'a> System<'a> for CleanupSystem {
    type SystemData = CleanupSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        sys_data.moved.clear();
        sys_data.dealt_dmg.clear();
        sys_data.hp_change.clear();

        for (id, col_handle, atk_radius, _) in (
            &*sys_data.entities,
            &sys_data.col_handle,
            &sys_data.atk_radius,
            sys_data.death.drain(),
        ).join()
        {
            sys_data.entities.delete(id).unwrap();

            sys_data.collision_sys.remove(&[col_handle.0, atk_radius.0]);
        }
    }
}
