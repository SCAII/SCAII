//! This module is just to keep the `IntoSerialize` and `FromDeserialize` clutter out of the component declaration
//! modules.

use serde::{Deserialize, Serialize};
use specs::{
    error::NoError, prelude::*, saveload::{FromDeserialize, IntoSerialize, Marker},
};

use engine::components::{
    Attack, ContactState, ContactStates, Move, MoveBehavior, MoveTarget, Owner, Pos, SensorType,
    Sensors,
};

use std::collections::BTreeMap;

/* ---- Impls for ContactStates ---- */

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct ContactStatesData<M>(Vec<ContactStateData<M>>);

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
enum ContactStateData<M> {
    Started(M),
    Ongoing(M),
    Stopped(M),
}

impl<M: Marker + Serialize> IntoSerialize<M> for ContactStates {
    type Data = ContactStatesData<M>;
    type Error = NoError;

    fn into<F>(&self, mut ids: F) -> Result<Self::Data, Self::Error>
    where
        F: FnMut(Entity) -> Option<M>,
    {
        let mut out = Vec::with_capacity(self.0.len());
        for col_state in &self.0 {
            let dat = match col_state {
                ContactState::Ongoing(e) => ContactStateData::Ongoing(ids(*e).unwrap()),
                ContactState::Started(e) => ContactStateData::Started(ids(*e).unwrap()),
                ContactState::Stopped(e) => ContactStateData::Stopped(ids(*e).unwrap()),
            };
            out.push(dat);
        }
        Ok(ContactStatesData(out))
    }
}

impl<M: Marker> FromDeserialize<M> for ContactStates
where
    for<'de> M: Deserialize<'de>,
{
    type Data = ContactStatesData<M>;
    type Error = NoError;

    fn from<F>(data: Self::Data, mut ids: F) -> Result<Self, Self::Error>
    where
        F: FnMut(M) -> Option<Entity>,
    {
        let mut out = Vec::with_capacity(data.0.len());
        for col_state in data.0 {
            let dat = match col_state {
                ContactStateData::Ongoing(e) => ContactState::Ongoing(ids(e).unwrap()),
                ContactStateData::Started(e) => ContactState::Started(ids(e).unwrap()),
                ContactStateData::Stopped(e) => ContactState::Stopped(ids(e).unwrap()),
            };
            out.push(dat);
        }
        Ok(ContactStates(out))
    }
}

/* ---- Impls for Move ---- */

#[derive(Clone, PartialEq, Serialize, Deserialize)]
enum MoveTargetData<M> {
    Ground(Pos),
    AttackUnit(M),
}

#[derive(Clone, PartialEq, Serialize, Deserialize)]
struct MoveData<M> {
    behavior: MoveBehavior,
    target: MoveTargetData<M>,
}

impl<M: Marker + Serialize> IntoSerialize<M> for Move {
    type Data = MoveData<M>;
    type Error = NoError;

    fn into<F>(&self, mut ids: F) -> Result<Self::Data, Self::Error>
    where
        F: FnMut(Entity) -> Option<M>,
    {
        Ok(MoveData {
            behavior: self.behavior,
            target: match self.target {
                MoveTarget::Ground(pos) => MoveTargetData::Ground(pos),
                MoveTarget::AttackUnit(entity) => MoveTargetData::AttackUnit(ids(entity).unwrap()),
            },
        })
    }
}

impl<M: Marker> FromDeserialize<M> for Move
where
    for<'de> M: Deserialize<'de>,
{
    type Data = MoveData<M>;
    type Error = NoError;

    fn from<F>(data: Self::Data, mut ids: F) -> Result<Self, Self::Error>
    where
        F: FnMut(M) -> Option<Entity>,
    {
        Ok(Move {
            behavior: data.behavior,
            target: match data.target {
                MoveTargetData::Ground(pos) => MoveTarget::Ground(pos),
                MoveTargetData::AttackUnit(mark) => MoveTarget::AttackUnit(ids(mark).unwrap()),
            },
        })
    }
}

/* ---- Impls for Sensors ---- */

#[derive(Clone, Debug, Serialize, Deserialize)]
struct SensorsData<M>(BTreeMap<SensorType, M>);

impl<M: Marker + Serialize> IntoSerialize<M> for Sensors {
    type Data = SensorsData<M>;
    type Error = NoError;

    fn into<F>(&self, mut ids: F) -> Result<Self::Data, Self::Error>
    where
        F: FnMut(Entity) -> Option<M>,
    {
        let out = self.0.iter().map(|(k, v)| (*k, ids(*v).unwrap())).collect();

        Ok(SensorsData(out))
    }
}

impl<M: Marker> FromDeserialize<M> for Sensors
where
    for<'de> M: Deserialize<'de>,
{
    type Data = SensorsData<M>;
    type Error = NoError;

    fn from<F>(data: Self::Data, mut ids: F) -> Result<Self, Self::Error>
    where
        F: FnMut(M) -> Option<Entity>,
    {
        let out = data
            .0
            .into_iter()
            .map(|(k, v)| (k, ids(v).unwrap()))
            .collect();

        Ok(Sensors(out))
    }
}

/* ---- Impls for Owner ---- */

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OwnerData<M>(M);

impl<M: Marker + Serialize> IntoSerialize<M> for Owner {
    type Data = OwnerData<M>;
    type Error = NoError;

    fn into<F>(&self, mut ids: F) -> Result<Self::Data, Self::Error>
    where
        F: FnMut(Entity) -> Option<M>,
    {
        Ok(OwnerData(ids(self.0).unwrap()))
    }
}

impl<M: Marker> FromDeserialize<M> for Owner
where
    for<'de> M: Deserialize<'de>,
{
    type Data = OwnerData<M>;
    type Error = NoError;

    fn from<F>(data: Self::Data, mut ids: F) -> Result<Self, Self::Error>
    where
        F: FnMut(M) -> Option<Entity>,
    {
        Ok(Owner(ids(data.0).unwrap()))
    }
}

/* ---- Impls for Attack ---- */

#[derive(Debug, Serialize, Deserialize)]
struct AttackData<M>(M, f64);

impl<M: Marker + Serialize> IntoSerialize<M> for Attack {
    type Data = AttackData<M>;
    type Error = NoError;

    fn into<F>(&self, mut ids: F) -> Result<Self::Data, Self::Error>
    where
        F: FnMut(Entity) -> Option<M>,
    {
        Ok(AttackData(ids(self.target).unwrap(), self.time_since_last))
    }
}

impl<M: Marker> FromDeserialize<M> for Attack
where
    for<'de> M: Deserialize<'de>,
{
    type Data = AttackData<M>;
    type Error = NoError;

    fn from<F>(data: Self::Data, mut ids: F) -> Result<Self, Self::Error>
    where
        F: FnMut(M) -> Option<Entity>,
    {
        Ok(Attack {
            target: ids(data.0).unwrap(),
            time_since_last: data.1,
        })
    }
}
