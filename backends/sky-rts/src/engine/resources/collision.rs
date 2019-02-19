use nalgebra::Isometry2 as I2;
use nalgebra::Point2 as P2;
use ncollide::{
    broad_phase::BroadPhasePairFilter, world::{CollisionObject, CollisionWorld},
};
use specs::prelude::*;

#[derive(Debug, Eq, PartialEq, Clone, Copy, Hash)]
pub struct ColliderData {
    pub e: Entity,
    pub owner: Option<Entity>,
    pub sensor: bool,
}

pub type SkyCollisionWorld = CollisionWorld<P2<f64>, I2<f64>, ColliderData>;

pub fn new_collision_world() -> SkyCollisionWorld {
    let mut c_world = SkyCollisionWorld::new(0.02);
    c_world.register_broad_phase_pair_filter("entity owner filter", SkyBroadPhaseFilter);
    c_world.update();

    c_world
}

#[doc(hidden)]
pub struct SkyBroadPhaseFilter;

impl BroadPhasePairFilter<P2<f64>, I2<f64>, ColliderData> for SkyBroadPhaseFilter {
    fn is_pair_valid(
        &self,
        b1: &CollisionObject<P2<f64>, I2<f64>, ColliderData>,
        b2: &CollisionObject<P2<f64>, I2<f64>, ColliderData>,
    ) -> bool {
        // This seems to not be always working on add?
        b1.data().owner != Some(b2.data().e) && b2.data().owner != Some(b1.data().e)
    }
}
