use engine::components::{Movable, Move};
use engine::resources::{ReplayMode, Skip};
use engine::ActionInput;
use specs::prelude::*;
use specs::world::Index;

use scaii_defs::protos::Action as ScaiiAction;

#[derive(SystemData)]
pub struct InputSystemData<'a> {
    movable: ReadStorage<'a, Movable>,
    input: Write<'a, ActionInput>,
    ids: Entities<'a>,
    is_replay: Read<'a, ReplayMode>,

    skip: Write<'a, Skip>,
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
        use engine::components::{MoveBehavior, MoveTarget};
        use std::mem;

        let actions = mem::replace(&mut sys_data.input.0, None);
        let actions = if actions.is_some() {
            let (actions, skip, skip_lua) = to_action_list(actions.unwrap());
            // ignore skipping for replays
            if !sys_data.is_replay.0 {
                *sys_data.skip = Skip(skip, skip_lua);
            }
            actions
        } else {
            return;
        };

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
                        target: MoveTarget::AttackUnit(target),
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
    use protos::unit_action::Action as RtsAction;
    use protos::{ActionList, AttackUnit};

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
                _ => unimplemented!(), // whats this line do
            },
        })
        .collect();

    (actions, action.skip.unwrap_or_default(), action.skip_lua)
}

#[cfg(test)]
mod tests {
    use engine::components::{Movable, Move};
    use engine::ActionInput;
    use specs::prelude::*;

    use scaii_defs::protos::Action as ScaiiAction;

    use super::*;

    #[test]
    fn input() {
        use engine::components::{MoveBehavior, MoveTarget};
        use engine::{components, resources};
        use prost::Message;
        use protos::unit_action::Action;
        use protos::{ActionList, AttackUnit, UnitAction};
        let mut world = World::new();

        components::register_world_components(&mut world);
        resources::register_world_resources(&mut world);

        let test_player = world.create_entity().with(Movable(0)).build();

        let test_target = world.create_entity().build();

        let actions = ActionList {
            actions: vec![UnitAction {
                unit_id: test_player.id().into(),
                action: Some(Action::AttackUnit(AttackUnit {
                    target_id: test_target.id(),
                })),
            }],
            ..Default::default()
        };

        let mut buf = Vec::new();

        actions.encode(&mut buf).unwrap();

        world.write_resource::<ActionInput>().0 = Some(
            ScaiiAction {
                alternate_actions: Some(buf),
                ..Default::default()
            }.clone(),
        );

        let mut sys: Dispatcher = DispatcherBuilder::new()
            .add(InputSystem::new(), "input", &[])
            .build();

        sys.dispatch(&mut world.res);
        let moves = world.read_storage::<Move>();
        assert!(moves.get(test_player).unwrap().target == MoveTarget::AttackUnit(test_target)); // Verifies that test_player's target is test target
        assert!(moves.get(test_player).unwrap().behavior == MoveBehavior::Straight); // Verifies that test_player's move behavior is straight
    }

}
