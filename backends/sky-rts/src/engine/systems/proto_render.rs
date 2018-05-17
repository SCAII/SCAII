use specs::prelude::*;
use engine::components::{Color, Death, Delete, FactionId, Hp, HpChange, MovedFlag, Pos, Shape,
                         Spawned, UnitTypeTag};
use engine::{NeedsKeyInfo, Render};
use engine::resources::{CumReward, Skip};

use scaii_defs::protos::Entity as ScaiiEntity;

#[derive(SystemData)]
pub struct RenderSystemData<'a> {
    complete_rerender: Fetch<'a, NeedsKeyInfo>,
    color: ReadStorage<'a, Color>,
    pos: ReadStorage<'a, Pos>,
    shape: ReadStorage<'a, Shape>,
    hp: ReadStorage<'a, Hp>,
    hp_change: ReadStorage<'a, HpChange>,
    faction: ReadStorage<'a, FactionId>,
    moved: ReadStorage<'a, MovedFlag>,
    death: ReadStorage<'a, Death>,
    delete: ReadStorage<'a, Delete>,
    u_type: ReadStorage<'a, UnitTypeTag>,
    ids: Entities<'a>,
    skip: Fetch<'a, Skip>,
    spawn: ReadStorage<'a, Spawned>,
    cum_reward: Fetch<'a, CumReward>,

    out: FetchMut<'a, Render>,
}

#[derive(Default, Copy, Clone, Debug)]
pub struct RenderSystem {}

impl<'a> System<'a> for RenderSystem {
    type SystemData = RenderSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        if sys_data.skip.0 {
            return;
        }

        // Workaround, switch to HashMap<String,f64> when we can
        sys_data.out.0.cumulative_rewards = sys_data
            .cum_reward
            .0
            .iter()
            .map(|(k, v)| (k.clone(), format!("{}", v)))
            .collect();

        if sys_data.complete_rerender.0 {
            self.render_all(sys_data);
        } else {
            self.render_delta(sys_data);
        }
    }
}

impl RenderSystem {
    fn render_delta(&mut self, mut sys_data: RenderSystemData) {
        sys_data.out.0.entities.clear();

        for (pos, id) in (&sys_data.pos, &*sys_data.ids).join() {
            if !(sys_data.moved.get(id).is_some() || sys_data.death.get(id).is_some()
                || sys_data.delete.get(id).is_some()
                || sys_data.hp_change.get(id).is_some()
                || sys_data.spawn.get(id).is_some())
            {
                continue;
            }

            if sys_data.spawn.get(id).is_some() {
                let entity = self.render_new(
                    &sys_data,
                    id,
                    &*sys_data.color.get(id).unwrap(),
                    pos,
                    &*sys_data.shape.get(id).unwrap(),
                );

                sys_data.out.0.entities.push(entity);

                continue;
            }

            let mut entity = ScaiiEntity {
                id: id.id() as u64,
                pos: Some(pos.to_scaii_pos()),
                delete: sys_data.death.get(id).is_some() || sys_data.delete.get(id).is_some(),
                shapes: vec![],

                ..ScaiiEntity::default()
            };

            if sys_data.hp_change.get(id).is_some() {
                let hp_string = format!("{}", sys_data.hp.get(id).unwrap().curr_hp);
                entity
                    .float_string_metadata
                    .insert("Hitpoints".to_string(), hp_string);
            }

            sys_data.out.0.entities.push(entity);
        }
    }

    fn render_all(&mut self, mut sys_data: RenderSystemData) {
        sys_data.out.0.entities.clear();

        for (color, pos, shape, id) in (
            &sys_data.color,
            &sys_data.pos,
            &sys_data.shape,
            &*sys_data.ids,
        ).join()
        {
            let entity = self.render_new(&sys_data, id, color, pos, shape);
            sys_data.out.0.entities.push(entity);
        }
    }

    fn render_new(
        &mut self,
        sys_data: &RenderSystemData,
        id: Entity,
        color: &Color,
        pos: &Pos,
        shape: &Shape,
    ) -> ScaiiEntity {
        use std::collections::HashMap;

        let mut scaii_shape = shape.to_scaii_shape(0);

        scaii_shape.color = Some(color.to_scaii_color());
        scaii_shape.relative_pos = Some(Pos::new(0.0, 0.0).to_scaii_pos());

        // TODO: maybe keep these around in a pool to reduce allocations?
        //let float_metadata : HashMap<String, f32> = HashMap::with_capacity(1);
        //let mut bool_metadata : HashMap<String, bool> = HashMap::with_capacity(2);
        let mut string_metadata: HashMap<String, String> = HashMap::with_capacity(1);
        let mut bool_string_metadata: HashMap<String, String> = HashMap::with_capacity(2);
        let mut float_string_metadata: HashMap<String, String> = HashMap::with_capacity(2);

        // Special case for us = faction 0 for now, need to switch if we support multi-agent
        // or self-play later.
        let is_friend = sys_data.faction.get(id).unwrap().0 == 0;
        let hp = sys_data.hp.get(id).unwrap();
        let tag = sys_data.u_type.get(id).unwrap();

        /* There's some weirdness with the protobuf library so we need
        to use strings or we get weird undefined values. Hopefully fixable in
        the future.  */
        let hp_string = format!("{}", hp.curr_hp);
        let max_hp_string = format!("{}", hp.max_hp);
        float_string_metadata.insert("Hitpoints".to_string(), hp_string);
        float_string_metadata.insert("Max Hp".to_string(), max_hp_string);

        let enemy_string = format!("{}", !is_friend);
        let friend_string = format!("{}", is_friend);

        bool_string_metadata.insert("Enemy?".to_string(), enemy_string);
        bool_string_metadata.insert("Friend?".to_string(), friend_string);
        string_metadata.insert("Unit Type".to_string(), tag.0.clone());

        ScaiiEntity {
            shapes: vec![scaii_shape],
            id: id.id() as u64,
            delete: sys_data.death.get(id).is_some(),
            pos: Some(pos.to_scaii_pos()),
            float_string_metadata,
            string_metadata,
            bool_string_metadata,
            ..ScaiiEntity::default()
        }
    }
}
