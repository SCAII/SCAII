use ncollide::world::CollisionObjectHandle;
use specs::prelude::*;

#[derive(Debug, Clone, Copy, Component, PartialEq, Eq)]
#[storage(VecStorage)]
pub struct CollisionHandle(pub CollisionObjectHandle);

#[derive(Debug, Clone, Copy, Component, PartialEq, Eq)]
#[storage(VecStorage)]
pub struct AttackSensor(pub CollisionObjectHandle);
