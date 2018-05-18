use specs::prelude::*;
use engine::components::{AttackSensor, CollisionHandle, DealtDamage, Death, Delete, HpChange,
                         MovedFlag, Spawned};
use engine::resources::SkyCollisionWorld;

#[derive(SystemData)]
pub struct CleanupSystemData<'a> {
    death: WriteStorage<'a, Death>,
    delete: WriteStorage<'a, Delete>,
    spawned: WriteStorage<'a, Spawned>,
    moved: WriteStorage<'a, MovedFlag>,
    dealt_dmg: WriteStorage<'a, DealtDamage>,
    hp_change: WriteStorage<'a, HpChange>,
    entities: Entities<'a>,
    collision_sys: FetchMut<'a, SkyCollisionWorld>,

    col_handle: ReadStorage<'a, CollisionHandle>,
    atk_radius: ReadStorage<'a, AttackSensor>,
}

#[derive(Default)]
pub struct CleanupSystem;

impl<'a> System<'a> for CleanupSystem {
    type SystemData = CleanupSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        sys_data.moved.clear();
        sys_data.dealt_dmg.clear();
        sys_data.hp_change.clear();
        sys_data.spawned.clear();

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

        for (id, col_handle, atk_radius, _) in (
            &*sys_data.entities,
            &sys_data.col_handle,
            &sys_data.atk_radius,
            sys_data.delete.drain(),
        ).join()
        {
            sys_data.entities.delete(id).unwrap();

            sys_data.collision_sys.remove(&[col_handle.0, atk_radius.0]);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use engine::components::{DealtDamage, HpChange, MovedFlag};

    #[test]
    fn cleanup() {
        use engine::{resources, components};

        let mut world = World::new();
        components::register_world_components(&mut world);
        resources::register_world_resources(&mut world);

        let test_player = world
            .create_entity()
            .with(DealtDamage{ val: 100.0, ..Default::default()})
            .with(MovedFlag(1))
            .with(HpChange(1.0))
            .build();

        let mut sys = CleanupSystem;
        sys.run_now(&world.res);

        let cleared_moved = world.read::<MovedFlag>();
        assert!(cleared_moved.get(test_player).is_none());

        let cleared_damage = world.read::<DealtDamage>();
        assert!(cleared_damage.get(test_player).is_none());

        let cleared_hp = world.read::<HpChange>();
        assert!(cleared_hp.get(test_player).is_none());
    }
}
