use engine::components::{
    Attack, ContactStates, DealtDamage, Death, FactionId, Hp, HpChange, Move, Owner, SensorType,
    UnitTypeTag,
};
use engine::resources::{DeltaT, UnitTypeMap};
use specs::prelude::*;

#[derive(SystemData)]
pub struct AttackSystemData<'a> {
    moving: WriteStorage<'a, Move>,
    attack: WriteStorage<'a, Attack>,
    hp: WriteStorage<'a, Hp>,
    death: WriteStorage<'a, Death>,
    damage: WriteStorage<'a, DealtDamage>,
    hp_change: WriteStorage<'a, HpChange>,

    delta_t: Read<'a, DeltaT>,
    unit_type_map: Read<'a, UnitTypeMap>,
    tag: ReadStorage<'a, UnitTypeTag>,
    faction: ReadStorage<'a, FactionId>,
    sensor_type: ReadStorage<'a, SensorType>,
    contact_states: ReadStorage<'a, ContactStates>,
    owners: ReadStorage<'a, Owner>,
    entities: Entities<'a>,
}

pub struct AttackSystem;

impl<'a> System<'a> for AttackSystem {
    type SystemData = AttackSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        let delta_t = sys_data.delta_t.0;

        for (states, owner, _) in (
            &sys_data.contact_states,
            &sys_data.owners,
            &sys_data.sensor_type,
        ).join()
            .filter(|(_, _, t)| **t == SensorType::Attack)
        {
            let id = owner.0;

            for state in &states.0 {
                if state.started() && !sys_data.attack.get(id).is_some() {
                    acquire_target(
                        id,
                        state.target(),
                        &mut sys_data.moving,
                        &mut sys_data.attack,
                        *sys_data.faction.get(id).unwrap(),
                        *sys_data.faction.get(state.target()).unwrap(),
                    )
                } else if state.stopped() {
                    sys_data.attack.remove(id);
                    if sys_data.entities.is_alive(state.target()) {
                        sys_data.moving.insert(id, Move::attack(state.target()));
                    }
                }
            }
        }

        let mut dead_target = vec![];
        for (atk, tag, id) in (&mut sys_data.attack, &sys_data.tag, &*sys_data.entities).join() {
            if !sys_data.entities.is_alive(atk.target) {
                dead_target.push(id);
                continue;
            }
            let unit_type = sys_data.unit_type_map.tag_map.get(&tag.0).unwrap();

            atk.time_since_last += delta_t;

            if atk.time_since_last > unit_type.attack_delay {
                atk.time_since_last = 0.0;

                let tar_hp = sys_data.hp.get_mut(atk.target).unwrap();

                tar_hp.curr_hp -= unit_type.attack_damage;

                sys_data
                    .hp_change
                    .entry(atk.target)
                    .unwrap()
                    .or_insert(HpChange(0.0))
                    .0 -= unit_type.attack_damage;

                let dmg = sys_data.damage.entry(id).unwrap().or_insert(DealtDamage {
                    val: 0.0,
                    by_source: vec![],
                });
                dmg.val += unit_type.attack_damage;
                dmg.by_source.push((
                    unit_type.attack_damage,
                    *sys_data.faction.get(atk.target).unwrap(),
                ));

                if tar_hp.curr_hp <= 0.0 {
                    sys_data.death.insert(atk.target, Death { killer: id });
                }
            }
        }

        for id in dead_target {
            sys_data.attack.remove(id);
        }
    }
}

fn acquire_target<'a>(
    me: Entity,
    other_id: Entity,
    moving: &mut WriteStorage<'a, Move>,
    attack: &mut WriteStorage<'a, Attack>,
    faction1: FactionId,
    faction2: FactionId,
) {
    use std::f64;
    let explicit_atk = {
        let move_order = moving.get_mut(me);
        if move_order.is_some() {
            let move_order = move_order.unwrap();

            if (move_order.is_attacking() && move_order.attack_target().unwrap() != other_id)
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
    if explicit_atk || faction1 != faction2 {
        attack.insert(
            me,
            Attack {
                target: other_id,
                time_since_last: f64::INFINITY,
            },
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use engine::components::{Attack, Death, Hp, HpChange, UnitTypeTag};
    use engine::resources::{UnitType, UnitTypeMap};

    use std::collections::HashMap;

    #[test]
    fn attack() {
        use engine::{components, resources};

        let max_hp: f64 = 100.0;

        let mut world = World::new();
        components::register_world_components(&mut world);
        resources::register_world_resources(&mut world);
        let mut test_unit_type_map = UnitTypeMap::default();
        let mut units: HashMap<String, usize> = HashMap::new();
        let mut unit_types: HashMap<String, UnitType> = HashMap::new();

        units.insert("test_entity".to_string(), 0);
        test_unit_type_map.typ_ids = units;

        unit_types.insert("test_entity".to_string(), UnitType::default());
        test_unit_type_map.tag_map = unit_types;

        world.add_resource(test_unit_type_map);

        let test_target = world
            .create_entity()
            .with(Hp {
                max_hp: max_hp,
                curr_hp: 10.0,
            })
            .with(FactionId(0))
            .with(UnitTypeTag("test_entity".to_string()))
            .build();

        let test_player = world
            .create_entity()
            .with(Hp {
                max_hp: max_hp,
                curr_hp: max_hp,
            })
            .with(FactionId(1))
            .with(Attack {
                target: test_target,
                time_since_last: 200.0,
            })
            .with(UnitTypeTag("test_entity".to_string()))
            .build();

        let mut sys = AttackSystem;
        sys.run_now(&world.res);

        let hp_changed = world.read::<HpChange>(); // Verifies component exists because this test
        assert!(hp_changed.get(test_target).is_some()); // should cause the target to take damage

        let hps = world.read::<Hp>();
        assert!(hps.get(test_target).unwrap().curr_hp == 0.0); // Verifies that test target has 0 hp
        assert!(hps.get(test_player).unwrap().curr_hp == max_hp); // Verifies that test player did not take damage

        let dead_units = world.read::<Death>();
        assert!(dead_units.get(test_target).unwrap().killer == test_player); // Verifies that test player killed test_target
    }
}
