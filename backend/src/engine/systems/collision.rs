use specs::{Entity, FetchMut, ReadStorage, System, WriteStorage};
use engine::resources::SkyCollisionWorld;
use engine::components::{Attack, AttackSensor, CollisionHandle, FactionId, Move, MovedFlag, Pos};

#[derive(SystemData)]
pub struct CollisionSystemData<'a> {
    moved: ReadStorage<'a, MovedFlag>,
    pos: ReadStorage<'a, Pos>,
    c_handle: ReadStorage<'a, CollisionHandle>,
    atk_radius: ReadStorage<'a, AttackSensor>,
    faction: ReadStorage<'a, FactionId>,

    moving: WriteStorage<'a, Move>,
    attack: WriteStorage<'a, Attack>,
    col_world: FetchMut<'a, SkyCollisionWorld>,
}

pub struct CollisionSystem;

impl<'a> System<'a> for CollisionSystem {
    type SystemData = CollisionSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        use specs::Join;
        use nalgebra::{Isometry2, Vector2};
        use nalgebra;
        use engine::resources::COLLISION_SCALE;

        for (_, pos, c_handle, atk_handle) in (
            &sys_data.moved,
            &sys_data.pos,
            &sys_data.c_handle,
            &sys_data.atk_radius,
        ).join()
        {
            let pos = Isometry2::new(
                Vector2::new(pos.x / COLLISION_SCALE, pos.y / COLLISION_SCALE),
                nalgebra::zero(),
            );

            sys_data.col_world.set_position(c_handle.0, pos);
            sys_data.col_world.set_position(atk_handle.0, pos);
        }

        sys_data.col_world.update();

        for (obj1, obj2, _) in sys_data.col_world.contacts() {
            let eid1 = obj1.data().e;
            let eid2 = obj2.data().e;

            if eid1 == eid2 {
                continue;
            }

            let atk_radius1 = sys_data.atk_radius.get(eid1).unwrap();
            let atk_radius2 = sys_data.atk_radius.get(eid2).unwrap();

            let faction1 = sys_data.faction.get(eid1).unwrap().0;
            let faction2 = sys_data.faction.get(eid2).unwrap().0;

            match (
                obj1.handle() == atk_radius1.0,
                obj2.handle() == atk_radius2.0,
            ) {
                (true, false) => acquire_target(
                    eid1,
                    eid2,
                    &mut sys_data.moving,
                    &mut sys_data.attack,
                    faction1,
                    faction2,
                ),
                (false, true) => acquire_target(
                    eid2,
                    eid1,
                    &mut sys_data.moving,
                    &mut sys_data.attack,
                    faction2,
                    faction1,
                ),
                (true, true) => {} // technically unreachable with our blacklist
                (false, false) => {
                    continue; //unimplemented, actual bodies are colliding
                }
            }
        }
    }
}

fn acquire_target<'a>(
    me: Entity,
    other_id: Entity,
    moving: &mut WriteStorage<'a, Move>,
    attack: &mut WriteStorage<'a, Attack>,
    faction1: usize,
    faction2: usize,
) {
    use std::f64;
    let explicit_atk = {
        let move_order = moving.get_mut(me);
        if move_order.is_some() {
            let move_order = move_order.unwrap();

            if move_order.is_attacking() && move_order.attack_target().unwrap() != other_id
                || !move_order.is_attacking()
            {
                return;
            }

            true
        } else {
            false
        }
    };
    moving.remove(me);

    if attack.get(me).is_some() {
        return;
    }

    // Allows people to attack their own units, but only with an explicit order
    if explicit_atk || faction1 == faction2 {
        attack.insert(
            me,
            Attack {
                target: other_id,
                time_since_last: f64::INFINITY,
            },
        );
    }
}
