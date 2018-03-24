use specs::prelude::*;
use engine::components::{Attack, DealtDamage, Death, Hp, HpChange, UnitTypeTag};
use engine::resources::{DeltaT, UnitTypeMap};

#[derive(SystemData)]
pub struct AttackSystemData<'a> {
    attack: WriteStorage<'a, Attack>,
    hp: WriteStorage<'a, Hp>,
    death: WriteStorage<'a, Death>,
    damage: WriteStorage<'a, DealtDamage>,
    hp_change: WriteStorage<'a, HpChange>,

    delta_t: Fetch<'a, DeltaT>,
    unit_type_map: Fetch<'a, UnitTypeMap>,
    tag: ReadStorage<'a, UnitTypeTag>,
    entities: Entities<'a>,
}

pub struct AttackSystem;

impl<'a> System<'a> for AttackSystem {
    type SystemData = AttackSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        let delta_t = sys_data.delta_t.0;

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

                sys_data
                    .damage
                    .entry(id)
                    .unwrap()
                    .or_insert(DealtDamage(0.0))
                    .0 += unit_type.attack_damage;

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
