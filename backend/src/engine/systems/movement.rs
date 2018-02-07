use specs::{Entities, Entity, Fetch, ReadStorage, System, WriteStorage};
use engine::components::{Move, MoveBehavior, MoveTarget, MovedFlag, Pos, Speed};
use engine::DeltaT;

#[derive(SystemData)]
pub struct MoveSystemData<'a> {
    positions: WriteStorage<'a, Pos>,
    speeds: ReadStorage<'a, Speed>,
    moves: WriteStorage<'a, Move>,
    moved: WriteStorage<'a, MovedFlag>,
    delta_t: Fetch<'a, DeltaT>,
    ids: Entities<'a>,
}

#[derive(Default)]
pub struct MoveSystem {
    // Reduce allocations by caching the largest the list
    // of deferred target seeks has ever been
    target_cache: Vec<(Entity, Entity)>,
}

impl MoveSystem {
    pub fn new() -> Self {
        MoveSystem {
            target_cache: Vec::with_capacity(100),
        }
    }
}

impl<'a> System<'a> for MoveSystem {
    type SystemData = MoveSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        use specs::Join;

        let targets = &mut self.target_cache;

        for (pos, moves, speed, id) in (
            &mut sys_data.positions,
            &sys_data.moves,
            &sys_data.speeds,
            &*sys_data.ids,
        ).join()
        {
            sys_data.moved.insert(id, MovedFlag);

            match *moves {
                // For borrow reasons, we need to defer targeted moves until later
                // (we can't get a position while iterating over positions!)
                Move {
                    target: MoveTarget::Unit(target),
                    ..
                } => {
                    targets.push((id, target));
                    continue;
                }
                Move {
                    target: MoveTarget::Ground(ref tar_pos),
                    ref behavior,
                } => move_ground(pos, tar_pos, behavior, sys_data.delta_t.0, speed.0),
            }
        }

        for (id, target) in targets.drain(..) {
            if !sys_data.ids.is_alive(target) {
                sys_data.moves.remove(target);
                continue;
            }
            let tar_pos = match sys_data.positions.get(target) {
                None => continue,
                Some(pos) => pos.clone(),
            };
            let pos = sys_data.positions.get_mut(id).unwrap();
            let speed = sys_data.speeds.get(id).unwrap();

            move_ground(
                pos,
                &tar_pos,
                &MoveBehavior::Straight,
                sys_data.delta_t.0,
                speed.0,
            )
        }
    }
}

fn move_ground(pos: &mut Pos, tar_pos: &Pos, behavior: &MoveBehavior, delta_t: f64, speed: f64) {
    match *behavior {
        MoveBehavior::Straight => {
            let dir = **tar_pos - **pos;

            let mut new_pos = **pos + (dir.normalize() * delta_t * speed);

            let new_dir = **tar_pos - new_pos;

            /* Simple overshoot detection */

            if dir[0].signum() != new_dir[0].signum() {
                new_pos[0] = tar_pos[0];
            }

            if dir[1].signum() != new_dir[1].signum() {
                new_pos[1] = tar_pos[1];
            }

            **pos = new_pos;
        }
    }
}
