use engine::components::{
    CollisionHandle, ContactState, ContactStates, DealtDamage, Death, Delete, HpChange, MovedFlag,
    Sensors, Spawned,
};
use engine::resources::SkyCollisionWorld;
use specs::prelude::*;

#[derive(SystemData)]
pub struct CleanupSystemData<'a> {
    death: WriteStorage<'a, Death>,
    delete: WriteStorage<'a, Delete>,
    spawned: WriteStorage<'a, Spawned>,
    moved: WriteStorage<'a, MovedFlag>,
    dealt_dmg: WriteStorage<'a, DealtDamage>,
    hp_change: WriteStorage<'a, HpChange>,
    contact_states: WriteStorage<'a, ContactStates>,
    entities: Entities<'a>,
    c_world: Write<'a, SkyCollisionWorld>,

    c_handles: ReadStorage<'a, CollisionHandle>,
    sensors: ReadStorage<'a, Sensors>,
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

        for (id, _) in (&*sys_data.entities, sys_data.death.drain()).join() {
            finalize_entity(
                id,
                &sys_data.entities,
                &sys_data.sensors,
                &sys_data.c_handles,
                &mut sys_data.c_world,
            );
        }

        for (id, _) in (&*sys_data.entities, sys_data.delete.drain()).join() {
            finalize_entity(
                id,
                &sys_data.entities,
                &sys_data.sensors,
                &sys_data.c_handles,
                &mut sys_data.c_world,
            );
        }

        for states in (&mut sys_data.contact_states).join() {
            collision_advancements(&mut states.0, &sys_data.entities);
        }
    }
}

/// Removes any Entity and its related children (such as sensors).
fn finalize_entity(
    id: Entity,
    entities: &Entities,
    sensors: &ReadStorage<Sensors>,
    c_handles: &ReadStorage<CollisionHandle>,
    c_world: &mut SkyCollisionWorld,
) {
    // Due to the interaction of sensors/child objects in general
    // and delete_all we need to verify the collision object is actually
    // being deleted
    if let Some(sensors) = sensors.get(id) {
        for &sensor in sensors.0.values() {
            let handle = c_handles.get(sensor).expect("Sensor has no collision?");

            if c_world.collision_object(handle.0).is_some() {
                c_world.remove(&[handle.0]);
            }

            entities.delete(sensor).unwrap();
        }
    }
    entities.delete(id).unwrap();

    if let Some(handle) = c_handles.get(id) {
        if c_world.collision_object(handle.0).is_some() {
            c_world.remove(&[handle.0]);
        }
    }
}

/// Filters expired collisions, collisions with dead entities, and then
/// switches new collisions to ongoing ones
fn collision_advancements(states: &mut Vec<ContactState>, entities: &Entities) {
    states.retain(|v| !v.stopped() && entities.is_alive(v.target()));
    for state in states.iter_mut() {
        if state.started() {
            *state = ContactState::Ongoing(state.target());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use engine::components::{DealtDamage, HpChange, MovedFlag};

    #[test]
    fn cleanup() {
        use engine::{components, resources};

        let mut world = World::new();
        components::register_world_components(&mut world);
        resources::register_world_resources(&mut world);

        let test_player = world
            .create_entity()
            .with(DealtDamage {
                val: 100.0,
                ..Default::default()
            })
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
