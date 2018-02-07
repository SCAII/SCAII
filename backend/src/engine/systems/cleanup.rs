use specs::{Entities, FetchMut, ReadStorage, System, WriteStorage};
use engine::components::{AttackSensor, CollisionHandle, Death, MovedFlag};
use engine::resources::SkyCollisionWorld;

#[derive(SystemData)]
pub struct CleanupSystemData<'a> {
    death: WriteStorage<'a, Death>,
    moved: WriteStorage<'a, MovedFlag>,
    entities: Entities<'a>,
    collision_sys: FetchMut<'a, SkyCollisionWorld>,

    col_handle: ReadStorage<'a, CollisionHandle>,
    atk_radius: ReadStorage<'a, AttackSensor>,
}

pub struct CleanupSystem;

impl<'a> System<'a> for CleanupSystem {
    type SystemData = CleanupSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        use specs::Join;
        sys_data.moved.clear();

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
