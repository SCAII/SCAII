use std::error::Error;
use std::fmt::{Debug, Display};
use std::fmt;

use super::Pos;

use specs::prelude::*;
use specs::storage::{HashMapStorage, NullStorage};
use specs::saveload::SaveLoadComponent;
use specs::error::NoError;

use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Default, Component, PartialEq, Serialize, Deserialize)]
#[storage(VecStorage)]
pub struct Speed(pub f64);

#[derive(Copy, Clone, Default, Component, PartialEq, Serialize, Deserialize)]
#[storage(NullStorage)]
pub struct Movable;

// Opposite of movable for entities with a shape that can't be moved
#[derive(Copy, Clone, Default, Component, PartialEq, Serialize, Deserialize)]
#[storage(NullStorage)]
pub struct Static;

#[derive(Copy, Clone, PartialEq, Serialize, Deserialize)]
pub enum MoveBehavior {
    Straight,
}

#[derive(Copy, Clone, PartialEq)]
pub enum MoveTarget {
    Ground(Pos),
    Unit(Entity),
}

#[derive(Component, Copy, Clone, PartialEq)]
#[storage(HashMapStorage)]
pub struct Move {
    pub behavior: MoveBehavior,
    pub target: MoveTarget,
}

impl Move {
    pub fn is_attacking(&self) -> bool {
        match self.target {
            MoveTarget::Unit(_) => true,
            _ => false,
        }
    }

    pub fn attack_target(&self) -> Option<Entity> {
        match self.target {
            MoveTarget::Unit(id) => Some(id),
            _ => None,
        }
    }
}

#[derive(Clone, PartialEq, Serialize, Deserialize)]
pub enum MarkedMoveTarget<M> {
    Ground(Pos),
    Unit(M),
}

#[derive(Clone, PartialEq, Serialize, Deserialize)]
pub struct MoveData<M> {
    pub behavior: MoveBehavior,
    pub target: MarkedMoveTarget<M>,
}

#[derive(Debug)]
pub enum NoTargetError<M: Debug> {
    Entity(Entity),
    Marker(M),
}

impl<M: Debug> Display for NoTargetError<M> {
    fn fmt(&self, formatter: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        write!(formatter, "Target not found: {:?}", self)
    }
}

impl<M: Debug> Error for NoTargetError<M> {
    fn description(&self) -> &str {
        "Could not find target when (de)serializing"
    }
}

impl<M: Debug + Serialize> SaveLoadComponent<M> for Move
where
    for<'de> M: Deserialize<'de>,
{
    type Data = MoveData<M>;
    type Error = NoError;

    fn save<F>(&self, mut ids: F) -> Result<MoveData<M>, Self::Error>
    where
        F: FnMut(Entity) -> Option<M>,
    {
        Ok(MoveData {
            behavior: self.behavior,
            target: match self.target {
                MoveTarget::Ground(pos) => MarkedMoveTarget::Ground(pos),
                MoveTarget::Unit(entity) => MarkedMoveTarget::Unit(ids(entity).unwrap()),
            },
        })
    }

    fn load<F>(data: MoveData<M>, mut ids: F) -> Result<Self, Self::Error>
    where
        F: FnMut(M) -> Option<Entity>,
    {
        Ok(Move {
            behavior: data.behavior,
            target: match data.target {
                MarkedMoveTarget::Ground(pos) => MoveTarget::Ground(pos),
                MarkedMoveTarget::Unit(mark) => MoveTarget::Unit(ids(mark).unwrap()),
            },
        })
    }
}
