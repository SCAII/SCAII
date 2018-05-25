use std::fmt::Debug;

use ncollide::world::CollisionObjectHandle;
use specs::error::NoError;
use specs::prelude::*;
use specs::saveload::{FromDeserialize, IntoSerialize};
use specs::storage::HashMapStorage;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Component, PartialEq, Eq)]
#[storage(VecStorage)]
pub struct CollisionHandle(pub CollisionObjectHandle);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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
