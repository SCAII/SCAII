use std::error::Error;
use std::fmt::{Debug, Display};
use std::fmt;

use super::Pos;

use specs::{Entity, HashMapStorage, NullStorage, VecStorage};
use specs::saveload::{Marker, SaveLoadComponent};

#[derive(Copy, Clone, Default, Component, PartialEq, Serialize, Deserialize)]
#[component(VecStorage)]
pub struct Speed(pub f64);

#[derive(Copy, Clone, Default, Component, PartialEq, Serialize, Deserialize)]
#[component(NullStorage)]
pub struct Movable;

// Opposite of movable for entities with a shape that can't be moved
#[derive(Copy, Clone, Default, Component, PartialEq, Serialize, Deserialize)]
#[component(NullStorage)]
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
#[component(HashMapStorage)]
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
pub enum MarkedMoveTarget<M: Marker> {
    Ground(Pos),
    Unit(#[serde(bound = "M: Marker")] M),
}

#[derive(Clone, PartialEq, Serialize, Deserialize)]
pub struct MoveData<M: Marker> {
    pub behavior: MoveBehavior,
    #[serde(bound = "M: Marker")]
    pub target: MarkedMoveTarget<M>,
}

#[derive(Copy, Clone, Eq, PartialEq, Debug)]
pub enum NoTargetError<M: Marker> {
    Entity(Entity),
    Marker(M),
}

impl<M: Marker + Debug> Display for NoTargetError<M> {
    fn fmt(&self, formatter: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        write!(formatter, "Target not found: {:?}", self)
    }
}

impl<M: Marker + Debug> Error for NoTargetError<M> {
    fn description(&self) -> &str {
        "Could not find target when (de)serializing"
    }
}

impl<M: Marker + Debug> SaveLoadComponent<M> for Move {
    type Data = MoveData<M>;
    type Error = NoTargetError<M>;

    fn save<F>(&self, mut ids: F) -> Result<MoveData<M>, Self::Error>
    where
        F: FnMut(Entity) -> Option<M>,
    {
        Ok(MoveData {
            behavior: self.behavior,
            target: match self.target {
                MoveTarget::Ground(pos) => MarkedMoveTarget::Ground(pos),
                MoveTarget::Unit(entity) => {
                    MarkedMoveTarget::Unit(ids(entity).ok_or_else(|| NoTargetError::Entity(entity))?)
                }
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
                MarkedMoveTarget::Unit(mark) => {
                    MoveTarget::Unit(ids(mark).ok_or_else(|| NoTargetError::Marker(mark))?)
                }
            },
        })
    }
}
