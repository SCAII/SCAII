use std::fmt::Debug;

use ncollide::world::CollisionObjectHandle;
use specs::error::NoError;
use specs::prelude::*;
use specs::saveload::{FromDeserialize, IntoSerialize, Marker};
use specs::storage::HashMapStorage;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Component, PartialEq, Eq)]
#[storage(VecStorage)]
pub struct CollisionHandle(pub CollisionObjectHandle);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Saveload)]
pub enum ContactState {
    Started(Entity),
    Ongoing(Entity),
    Stopped(Entity),
}

impl ContactState {
    pub fn target(&self) -> Entity {
        match *self {
            ContactState::Started(e) => e,
            ContactState::Ongoing(e) => e,
            ContactState::Stopped(e) => e,
        }
    }

    #[allow(dead_code)]
    pub fn started(&self) -> bool {
        match self {
            ContactState::Started(_) => true,
            _ => false,
        }
    }

    #[allow(dead_code)]
    pub fn stopped(&self) -> bool {
        match self {
            ContactState::Stopped(_) => true,
            _ => false,
        }
    }

    #[allow(dead_code)]
    pub fn ongoing(&self) -> bool {
        match self {
            ContactState::Ongoing(_) => true,
            _ => false,
        }
    }
}

// In the future we could make this an array so it could
// be stored inline
#[derive(Debug, Clone, Component, Default)]
#[storage(HashMapStorage)]
pub struct ContactStates(pub Vec<ContactState>);

/* ---- Impls for ContactStates ---- */

#[derive(Clone, Serialize, Deserialize)]
#[serde(bound = "")]
#[doc(hidden)]
pub struct ContactStatesData<M: Marker>(Vec<ContactStateSaveloadData<M>>);

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
                ContactState::Ongoing(e) => ContactStateSaveloadData::Ongoing(ids(*e).unwrap()),
                ContactState::Started(e) => ContactStateSaveloadData::Started(ids(*e).unwrap()),
                ContactState::Stopped(e) => ContactStateSaveloadData::Stopped(ids(*e).unwrap()),
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
                ContactStateSaveloadData::Ongoing(e) => ContactState::Ongoing(ids(e).unwrap()),
                ContactStateSaveloadData::Started(e) => ContactState::Started(ids(e).unwrap()),
                ContactStateSaveloadData::Stopped(e) => ContactState::Stopped(ids(e).unwrap()),
            };
            out.push(dat);
        }
        Ok(ContactStates(out))
    }
}
