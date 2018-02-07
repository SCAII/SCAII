use specs::{Entities, FetchMut, Index, ReadStorage, System, WriteStorage};
use engine::components::{Movable, Move};
use engine::resources::Skip;
use engine::ActionInput;

use scaii_defs::protos::Action as ScaiiAction;

#[derive(SystemData)]
pub struct InputSystemData<'a> {
    movable: ReadStorage<'a, Movable>,
    input: FetchMut<'a, ActionInput>,
    ids: Entities<'a>,

    skip: FetchMut<'a, Skip>,
    moves: WriteStorage<'a, Move>,
}

#[derive(Default)]
pub struct InputSystem {}

impl InputSystem {
    pub fn new() -> Self {
        InputSystem {}
    }
}

impl<'a> System<'a> for InputSystem {
    type SystemData = InputSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        use std::mem;
        use engine::components::{MoveBehavior, MoveTarget};

        let actions = mem::replace(&mut sys_data.input.0, None);

        let (actions, skip, skip_lua) = to_action_list(actions.unwrap_or(Default::default()));

        *sys_data.skip = Skip(skip, skip_lua);

        for action in actions {
            let entity = sys_data.ids.entity(action.unit_id);

            // Maybe set an error state later?
            if !sys_data.ids.is_alive(entity) {
                continue;
            }

            if !sys_data.movable.get(entity).is_some() {
                continue;
            }

            let move_order = match action.action {
                ActionTarget::Attack(tar_id) => {
                    let target = sys_data.ids.entity(tar_id);
                    if !sys_data.ids.is_alive(target) {
                        continue;
                    }

                    Move {
                        behavior: MoveBehavior::Straight,
                        target: MoveTarget::Unit(target),
                    }
                }
            };

            sys_data.moves.insert(entity, move_order);
        }

        // for (pos, moves, id) in (&mut sys_data.positions, &sys_data.moves, &*sys_data.ids).join() {}
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
struct Action {
    unit_id: Index,
    action: ActionTarget,
}

#[derive(Debug, Copy, Clone, PartialEq)]
enum ActionTarget {
    Attack(Index),
}

fn to_action_list(raw: ScaiiAction) -> (Vec<Action>, bool, Option<String>) {
    use prost::Message;
    use protos::{ActionList, AttackUnit};
    use protos::unit_action::Action as RtsAction;

    if raw.alternate_actions.is_none() {
        return Default::default();
    }

    let action: ActionList =
        ActionList::decode(raw.alternate_actions.unwrap()).expect("Could parse inner message");

    let actions = action
        .actions
        .into_iter()
        .map(|a| Action {
            unit_id: a.unit_id as Index,
            action: match a.action.expect("Expected an action descriptor") {
                RtsAction::AttackUnit(AttackUnit { target_id }) => {
                    ActionTarget::Attack(target_id as Index)
                }
                _ => unimplemented!(),
            },
        })
        .collect();

    (actions, action.skip.unwrap_or_default(), action.skip_lua)
}
