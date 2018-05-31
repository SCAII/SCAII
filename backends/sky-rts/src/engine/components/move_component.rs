use std::fmt::Debug;

use super::Pos;

use specs::error::NoError;
use specs::prelude::*;
use specs::saveload::{FromDeserialize, IntoSerialize};
use specs::storage::HashMapStorage;

use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Default, Component, PartialEq, Serialize, Deserialize)]
#[storage(VecStorage)]
pub struct Speed(pub f64);

#[derive(Copy, Clone, Default, Component, PartialEq, Serialize, Deserialize)]
#[storage(HashMapStorage)]
pub struct Movable(pub usize);

#[derive(Copy, Clone, PartialEq, Serialize, Deserialize, Debug)]
pub enum MoveBehavior {
    Straight,
}

#[derive(Copy, Clone, PartialEq, Debug, Saveload)]
pub enum MoveTarget {
    Ground(Pos),
    AttackUnit(Entity),
}

#[derive(Component, Copy, Clone, PartialEq, Debug, Saveload)]
#[storage(HashMapStorage)]
pub struct Move {
    pub behavior: MoveBehavior,
    pub target: MoveTarget,
}

impl Move {
    pub fn attack(target: Entity) -> Self {
        Move {
            behavior: MoveBehavior::Straight,
            target: MoveTarget::AttackUnit(target),
        }
    }

    pub fn is_attacking(&self) -> bool {
        match self.target {
            MoveTarget::AttackUnit(_) => true,
            _ => false,
        }
    }

    pub fn attack_target(&self) -> Option<Entity> {
        match self.target {
            MoveTarget::AttackUnit(id) => Some(id),
            _ => None,
        }
    }
}
