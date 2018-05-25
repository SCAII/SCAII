use specs::error::NoError;
use specs::prelude::*;
use specs::saveload::{FromDeserialize, IntoSerialize};
use specs::storage::HashMapStorage;

use serde::{Deserialize, Serialize};

use std::{collections::BTreeMap, fmt::Debug};

#[derive(Copy, Clone, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Component, Serialize,
         Deserialize)]
#[storage(HashMapStorage)]
pub enum SensorType {
    Attack,
}

pub fn build_attack_sensor(world: &mut World, owner: Entity, radius: f64) -> Entity {
    use super::Owner;
    use specs::saveload::U64Marker;
    let entity = world
        .create_entity()
        .marked::<U64Marker>()
        .with(SensorType::Attack)
        .with(Owner(owner))
        .with(SensorRadius(radius))
        .build();

    register_sensor_collision(world, entity)
}

pub fn register_sensor_collision(world: &mut World, sensor: Entity) -> Entity {
    use super::{FactionId, Owner, Pos};
    use engine::{
        components::CollisionHandle,
        resources::{
            ColliderData, SkyCollisionWorld, COLLISION_SCALE, SENSOR_BLACKLIST, SENSOR_OFFSET,
            UNIVERSAL_SENSOR,
        },
    };
    use nalgebra;
    use nalgebra::{Isometry2, Vector2};
    use ncollide::{
        shape::{Ball, ShapeHandle}, world::{CollisionGroups, GeometricQueryType},
    };

    let sensor_radius = *world.read_storage::<SensorRadius>().get(sensor).unwrap();
    let c_world = &mut *world.write_resource::<SkyCollisionWorld>();

    let (pos, group_membership) = if let Some(owner) = world.read_storage::<Owner>().get(sensor) {
        let pos = *world
            .read_storage::<Pos>()
            .get(owner.0)
            .expect("owner has no pos?");
        let faction = *world
            .read_storage::<FactionId>()
            .get(owner.0)
            .expect("owner has no faction ID?");

        (pos.0, faction.0 + SENSOR_OFFSET)
    } else {
        let pos = *world
            .read_storage::<Pos>()
            .get(sensor)
            .expect("No owner or pos?");
        let group = UNIVERSAL_SENSOR;

        (pos.0, group)
    };

    let mut sensor_group = CollisionGroups::new();
    sensor_group.set_membership(&[group_membership]);
    sensor_group.set_blacklist(&SENSOR_BLACKLIST);

    let sensor_shape = Ball::new(sensor_radius.0 / COLLISION_SCALE);
    let sensor_shape = ShapeHandle::new(sensor_shape);

    let pos = Isometry2::new(
        Vector2::new(pos.x / COLLISION_SCALE, pos.y / COLLISION_SCALE),
        nalgebra::zero(),
    );

    let q_type = GeometricQueryType::Contacts(0.0, 0.0);
    let collider = c_world.0.add(
        pos,
        sensor_shape,
        sensor_group,
        q_type,
        ColliderData {
            e: sensor,
            owner: world.read_storage::<Owner>().get(sensor).map(|v| v.0),
            sensor: true,
        },
    );

    world
        .write_storage::<CollisionHandle>()
        .insert(sensor, CollisionHandle(collider));

    sensor
}

#[derive(Clone, Debug, Copy, Default, PartialEq, PartialOrd, Serialize, Deserialize, Component)]
#[storage(HashMapStorage)]
pub struct SensorRadius(pub f64);

#[derive(Clone, Debug, Default, Component)]
#[storage(HashMapStorage)]
pub struct Sensors(pub BTreeMap<SensorType, Entity>);
