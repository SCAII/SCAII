use engine::components::{CollisionHandle, FactionId, Pos, SensorType, UnitTypeTag};
use engine::resources::{SkyCollisionWorld, UnitTypeMap};
use specs::prelude::*;

pub struct RedoCollisionSys;

impl RedoCollisionSys {
    pub fn redo_collision(&mut self, world: &mut World) {
        use engine::components::sensor;

        *world.write_resource::<SkyCollisionWorld>() = Default::default();

        for (pos, tag, faction, id) in (
            &world.read::<Pos>(),
            &world.read::<UnitTypeTag>(),
            &world.read::<FactionId>(),
            &*world.entities(),
        ).join()
        {
            // Borrow checker won't let us one line this
            let u_type = world.read_resource::<UnitTypeMap>();
            let u_type = u_type.tag_map.get(&tag.0).unwrap();

            u_type.register_collision(
                id,
                *pos,
                faction.0,
                &mut world.write::<CollisionHandle>(),
                &mut *world.write_resource::<SkyCollisionWorld>(),
            );
        }

        // Maybe use one-time allocation bucket approach in the future like other systems
        let mut sensors = Vec::new();
        sensors.extend(
            (&*world.entities(), &world.read::<SensorType>())
                .join()
                .map(|(id, _)| id),
        );

        for sensor_id in sensors {
            sensor::register_sensor_collision(world, sensor_id);
        }

        world.write_resource::<SkyCollisionWorld>().update();
    }
}
