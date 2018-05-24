use engine::components::{CollisionHandle, ContactState, ContactStates, MovedFlag, Pos, Sensors};
use engine::resources::SkyCollisionWorld;
use ncollide::world::CollisionObjectHandle;
use specs::prelude::*;

#[derive(SystemData)]
pub struct CollisionSystemData<'a> {
    moved: ReadStorage<'a, MovedFlag>,
    pos: ReadStorage<'a, Pos>,
    c_handle: ReadStorage<'a, CollisionHandle>,
    sensors: ReadStorage<'a, Sensors>,
    ids: Entities<'a>,

    contact_states: WriteStorage<'a, ContactStates>,

    col_world: Write<'a, SkyCollisionWorld>,
}

/// The `CollisionSystem` updates a moved entity's collisiion-related
/// marker positions (e.g. attack whiskers, rigid body, etc)
/// and registers the corresponding contact event components when collisions occur.
///
/// This is not responsible for removing no-longer happening collisions. That is the job
/// of the `CleanupSystem` which will remove `Stopped` collisions every update cycle.
///
/// In addition, other systems should verify their target has not disappeared, especially if relying on
/// `Ongoing` collision tags.
pub struct CollisionSystem;

impl<'a> System<'a> for CollisionSystem {
    type SystemData = CollisionSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        use engine::resources::COLLISION_SCALE;
        use nalgebra;
        use nalgebra::{Isometry2, Vector2};
        use ncollide::events::ContactEvent;

        for (_, pos, c_handle, id) in (
            &sys_data.moved,
            &sys_data.pos,
            &sys_data.c_handle,
            &*sys_data.ids,
        ).join()
        {
            let pos = Isometry2::new(
                Vector2::new(pos.x / COLLISION_SCALE, pos.y / COLLISION_SCALE),
                nalgebra::zero(),
            );

            sys_data.col_world.set_position(c_handle.0, pos);

            if let Some(sensors) = sys_data.sensors.get(id) {
                for &sensor in sensors.0.values() {
                    let sensor_ch = sys_data
                        .c_handle
                        .get(sensor)
                        .expect("Sensor has no collision?");
                    sys_data.col_world.set_position(sensor_ch.0, pos);
                }
            }
        }

        sys_data.col_world.update();

        for event in sys_data.col_world.contact_events() {
            match event {
                ContactEvent::Started(h1, h2) => {
                    handle_started(&sys_data.col_world, &mut sys_data.contact_states, *h1, *h2);
                }
                ContactEvent::Stopped(h1, h2) => {
                    handle_stopped(&sys_data.col_world, &mut sys_data.contact_states, *h1, *h2);
                }
            }
        }
    }
}

/// Inserts contact events into storages as they happen.
///
/// If one of the handles is a sensor, this will only flag the sensor's contact events.
///
/// If neither is a sensor, both will be flagged with a `Started` pointing
/// to the opposite entity's `Entity` handle.
///
/// During debug builds, this will verify that entities do not double-appear in
/// an entity's collision list, as well as verifying that sensors do not detect
/// each other.
fn handle_started(
    col_world: &SkyCollisionWorld,
    contact_states: &mut WriteStorage<ContactStates>,
    h1: CollisionObjectHandle,
    h2: CollisionObjectHandle,
) {
    let h1 = col_world.collision_object(h1).unwrap();
    let h2 = col_world.collision_object(h2).unwrap();

    let e1 = h1.data().e;
    let e2 = h2.data().e;

    debug_assert!(!(h1.data().sensor && h2.data().sensor));

    if h1.data().sensor {
        let states = &mut contact_states
            .entry(e1)
            .unwrap()
            .or_insert(Default::default())
            .0;
        debug_assert!(states.iter().filter(|v| v.target() == e2).count() == 0);
        states.push(ContactState::Started(e2));
    } else if h2.data().sensor {
        let states = &mut contact_states
            .entry(e2)
            .unwrap()
            .or_insert(Default::default())
            .0;
        debug_assert!(states.iter().filter(|v| v.target() == e1).count() == 0);
        states.push(ContactState::Started(e1));
    } else {
        {
            let states = &mut contact_states
                .entry(e1)
                .unwrap()
                .or_insert(Default::default())
                .0;
            debug_assert!(states.iter().filter(|v| v.target() == e2).count() == 0);
            states.push(ContactState::Started(e2));
        }

        let states = &mut contact_states
            .entry(e2)
            .unwrap()
            .or_insert(Default::default())
            .0;
        debug_assert!(states.iter().filter(|v| v.target() == e1).count() == 0);
        states.push(ContactState::Started(e1));
    }
}

/// Changes contact events into `Stopped` versions as they happen.
///
/// If one of the handles is a sensor, this will find the sensor's existing `Start`
/// or `Ongoing` corresponding to the detected entity and change it to `Stopped`
///
/// If neither is a sensor, this will symmetrically flag both with a `Stopped`
/// in the same manner.
///
/// During debug builds, this will verify that the target entity appears exactly
/// once in a list, as well as verifying that sensors do not detect
/// each other.
fn handle_stopped(
    col_world: &SkyCollisionWorld,
    contact_states: &mut WriteStorage<ContactStates>,
    h1: CollisionObjectHandle,
    h2: CollisionObjectHandle,
) {
    let h1 = col_world.collision_object(h1).unwrap();
    let h2 = col_world.collision_object(h2).unwrap();

    let e1 = h1.data().e;
    let e2 = h1.data().e;

    if e1 == e2 {
        return;
    }

    debug_assert!(!(h1.data().sensor && h2.data().sensor));

    if h1.data().sensor {
        let states = &mut contact_states
            .entry(e1)
            .unwrap()
            .or_insert(Default::default())
            .0;
        debug_assert!(states.iter().filter(|v| v.target() == e2).count() == 1);

        for v in states.iter_mut().filter(|v| v.target() == e2) {
            *v = ContactState::Stopped(v.target());
        }
    } else if h2.data().sensor {
        let states = &mut contact_states
            .entry(e2)
            .unwrap()
            .or_insert(Default::default())
            .0;
        debug_assert!(states.iter().filter(|v| v.target() == e1).count() == 1);
        for v in states.iter_mut().filter(|v| v.target() == e2) {
            *v = ContactState::Stopped(v.target());
        }
    } else {
        {
            let states = &mut contact_states
                .entry(e1)
                .unwrap()
                .or_insert(Default::default())
                .0;
            debug_assert!(states.iter().filter(|v| v.target() == e2).count() == 1);
            for v in states.iter_mut().filter(|v| v.target() == e2) {
                *v = ContactState::Stopped(v.target());
            }
        }

        let states = &mut contact_states
            .entry(e2)
            .unwrap()
            .or_insert(Default::default())
            .0;
        debug_assert!(states.iter().filter(|v| v.target() == e1).count() == 1);
        for v in states.iter_mut().filter(|v| v.target() == e2) {
            *v = ContactState::Stopped(v.target());
        }
    }
}
