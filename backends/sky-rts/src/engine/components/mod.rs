use nalgebra::Point2;

use engine::resources::DataStore;

use specs::error::NoError;
use specs::prelude::*;
use specs::saveload::SaveLoadComponent;
use specs::storage::{HashMapStorage, NullStorage};

use std::fmt::Debug;
use std::ops::{Deref, DerefMut};

use scaii_defs::protos::Color as ScaiiColor;
use scaii_defs::protos::Pos as ScaiiPos;
use scaii_defs::protos::Rect as ScaiiRect;
use scaii_defs::protos::Shape as ScaiiShape;
use scaii_defs::protos::Triangle as ScaiiTriangle;

use serde::{Deserialize, Serialize};

// `move` is a reserved keyword, so we need to
// extend the name a little. Other submods should probably
// just be named things like `render` rather than
// `render_component`.
pub(crate) mod collision;
pub(crate) mod move_component;
pub(crate) mod sensor;

pub use self::{
    collision::*, move_component::*, sensor::{SensorRadius, SensorType, Sensors},
};

pub(super) fn register_world_components(world: &mut World) {
    use specs::saveload::U64Marker;

    world.register::<Pos>();
    world.register::<Heading>();
    world.register::<Move>();
    world.register::<Movable>();
    world.register::<MovedFlag>();
    world.register::<Hp>();
    world.register::<DealtDamage>();
    world.register::<HpChange>();
    world.register::<Shape>();
    world.register::<Color>();
    world.register::<Speed>();
    world.register::<U64Marker>();
    world.register::<FactionId>();
    world.register::<CollisionHandle>();
    world.register::<UnitTypeTag>();
    world.register::<Attack>();
    world.register::<Death>();
    world.register::<Delete>();
    world.register::<Spawned>();
    world.register::<DataStoreComponent>();
    world.register::<ContactStates>();
    world.register::<Owner>();
    world.register::<SensorType>();
    world.register::<SensorRadius>();
    world.register::<Sensors>();
}

#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Pos(pub Point2<f64>);

impl Pos {
    pub fn new(x: f64, y: f64) -> Self {
        Pos(Point2::new(x, y))
    }

    pub fn to_scaii_pos(&self) -> ScaiiPos {
        ScaiiPos {
            x: Some(self.x),
            y: Some(self.y),
        }
    }
}

impl Component for Pos {
    type Storage = FlaggedStorage<Self, VecStorage<Self>>;
}

impl Deref for Pos {
    type Target = Point2<f64>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for Pos {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

#[derive(Component, Copy, Clone, PartialEq, Serialize, Deserialize)]
#[storage(VecStorage)]
pub struct Heading(f64);

#[derive(Default, Component, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[storage(HashMapStorage)]
pub struct MovedFlag(pub usize);

#[derive(Default, Component, Debug, Copy, Clone, PartialEq, Serialize, Deserialize)]
#[storage(VecStorage)]
pub struct Hp {
    pub max_hp: f64,
    pub curr_hp: f64,
}

#[derive(Component, Clone, PartialEq)]
#[storage(HashMapStorage)]
pub struct HpChange(pub f64);

#[derive(Component, Clone, Default, PartialEq)]
#[storage(HashMapStorage)]
pub struct DealtDamage {
    pub val: f64,
    pub by_source: Vec<(f64, FactionId)>,
}

#[derive(Default, Component, Copy, Clone, PartialEq, Eq, Serialize, Debug, Deserialize)]
#[storage(VecStorage)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl Color {
    pub fn to_scaii_color(&self) -> ScaiiColor {
        use std::u8;

        ScaiiColor {
            r: self.r as u32,
            g: self.g as u32,
            b: self.b as u32,
            a: u8::MAX as u32,
        }
    }
}

#[derive(Component, Copy, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[storage(VecStorage)]
pub enum Shape {
    Triangle { base_len: f64 },
    Rect { width: f64, height: f64 },
}

impl Shape {
    pub fn to_scaii_shape(&self, id: u64) -> ScaiiShape {
        ScaiiShape {
            id: id,
            delete: false,
            rect: match *self {
                Shape::Rect {
                    ref width,
                    ref height,
                } => Some(ScaiiRect {
                    width: Some(*width),
                    height: Some(*height),
                }),
                _ => None,
            },
            triangle: match *self {
                Shape::Triangle { ref base_len } => Some(ScaiiTriangle {
                    base_len: Some(*base_len),
                }),
                _ => None,
            },
            ..ScaiiShape::default()
        }
    }

    pub fn compute_extended_radius(&self, range: f64) -> f64 {
        match self {
            Shape::Triangle { base_len } => {
                let half_height = base_len / (2.0 as f64).sqrt() / 2.0;
                half_height + range
            }
            Shape::Rect { width, height } => {
                let half_diagonal = (width * width + height * height).sqrt() / 2.0;
                half_diagonal + range
            }
        }
    }
}

#[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash, Default, Debug, Serialize,
         Deserialize, Component)]
#[storage(VecStorage)]
pub struct FactionId(pub usize);

#[derive(Clone, Eq, PartialEq, Hash, Default, Debug, Serialize, Deserialize, Component)]
#[storage(VecStorage)]
pub struct UnitTypeTag(pub String);

#[derive(Clone, PartialEq, Debug, Component)]
#[storage(HashMapStorage)]
pub struct Attack {
    pub target: Entity,
    pub time_since_last: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AttackData<M: Debug>(pub M, pub f64);

impl<M: Debug + Serialize> SaveLoadComponent<M> for Attack
where
    for<'de> M: Deserialize<'de>,
{
    type Data = AttackData<M>;
    type Error = NoError;

    fn save<F>(&self, mut ids: F) -> Result<AttackData<M>, Self::Error>
    where
        F: FnMut(Entity) -> Option<M>,
    {
        Ok(AttackData(ids(self.target).unwrap(), self.time_since_last))
    }

    fn load<F>(data: AttackData<M>, mut ids: F) -> Result<Self, Self::Error>
    where
        F: FnMut(M) -> Option<Entity>,
    {
        Ok(Attack {
            target: ids(data.0).unwrap(),
            time_since_last: data.1,
        })
    }
}

#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Debug, Component)]
#[storage(HashMapStorage)]
pub struct Death {
    pub killer: Entity,
}

/// Delete differs from Death in that it yields no reward or on-death triggers
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Debug, Default, Component)]
#[storage(NullStorage)]
pub struct Delete;

#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Debug, Default, Component)]
#[storage(NullStorage)]
pub struct Spawned;

#[derive(Clone, Serialize, Deserialize, Default, Component)]
#[storage(VecStorage)]
pub struct DataStoreComponent(pub DataStore);

#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Debug, Component)]
#[storage(HashMapStorage)]
pub struct Owner(pub Entity);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OwnerData<M>(pub M);

impl<M: Debug + Serialize> SaveLoadComponent<M> for Owner
where
    for<'de> M: Deserialize<'de>,
{
    type Data = OwnerData<M>;
    type Error = NoError;

    fn save<F>(&self, mut ids: F) -> Result<Self::Data, Self::Error>
    where
        F: FnMut(Entity) -> Option<M>,
    {
        Ok(OwnerData(ids(self.0).unwrap()))
    }

    fn load<F>(data: Self::Data, mut ids: F) -> Result<Self, Self::Error>
    where
        F: FnMut(M) -> Option<Entity>,
    {
        Ok(Owner(ids(data.0).unwrap()))
    }
}
