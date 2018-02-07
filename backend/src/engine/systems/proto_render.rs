use specs::{Entities, Fetch, FetchMut, Join, ReadStorage, System};
use engine::components::{Color, Death, MovedFlag, Pos, Shape};
use engine::{NeedsKeyInfo, Render};
use engine::resources::Skip;

use scaii_defs::protos::Entity as ScaiiEntity;

#[derive(SystemData)]
pub struct RenderSystemData<'a> {
    complete_rerender: Fetch<'a, NeedsKeyInfo>,
    color: ReadStorage<'a, Color>,
    pos: ReadStorage<'a, Pos>,
    shape: ReadStorage<'a, Shape>,
    moved: ReadStorage<'a, MovedFlag>,
    death: ReadStorage<'a, Death>,
    ids: Entities<'a>,
    skip: Fetch<'a, Skip>,

    out: FetchMut<'a, Render>,
}

#[derive(Default, Copy, Clone, Debug)]
pub struct RenderSystem {}

impl<'a> System<'a> for RenderSystem {
    type SystemData = RenderSystemData<'a>;

    fn run(&mut self, sys_data: Self::SystemData) {
        if sys_data.skip.0 {
            return;
        }
        if sys_data.complete_rerender.0 {
            self.render_all(sys_data);
        } else {
            self.render_delta(sys_data);
        }
    }
}

impl RenderSystem {
    fn render_delta(&mut self, mut sys_data: RenderSystemData) {
        let out = &mut sys_data.out.0;
        out.entities.clear();

        for (pos, id) in (
            &sys_data.pos,
            &*sys_data.ids,
            // &sys_data.moved, // Just a filter
        ).join()
        {
            if !sys_data.moved.get(id).is_some() || !sys_data.death.get(id).is_some() {
                continue;
            }

            let entity = ScaiiEntity {
                id: id.id() as u64,
                pos: Some(pos.to_scaii_pos()),
                delete: sys_data.death.get(id).is_some(),
                shapes: vec![],
            };

            out.entities.push(entity);
        }
    }

    fn render_all(&mut self, mut sys_data: RenderSystemData) {
        let out = &mut sys_data.out.0;
        out.entities.clear();

        for (color, pos, shape, id) in (
            &sys_data.color,
            &sys_data.pos,
            &sys_data.shape,
            &*sys_data.ids,
        ).join()
        {
            let mut scaii_shape = shape.to_scaii_shape(0);

            scaii_shape.color = Some(color.to_scaii_color());
            scaii_shape.relative_pos = Some(Pos::new(0.0, 0.0).to_scaii_pos());

            let entity = ScaiiEntity {
                shapes: vec![scaii_shape],
                id: id.id() as u64,
                delete: sys_data.death.get(id).is_some(),
                pos: Some(pos.to_scaii_pos()),
            };

            out.entities.push(entity);
        }
    }
}
