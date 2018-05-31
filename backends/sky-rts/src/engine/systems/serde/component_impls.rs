//! This module is just to keep the `IntoSerialize` and `FromDeserialize` clutter out of the component declaration
//! modules.

use serde::{Deserialize, Serialize};
use specs::{
    error::NoError, prelude::*, saveload::{FromDeserialize, IntoSerialize, Marker},
};

use engine::components::{SensorType, Sensors};

use std::collections::BTreeMap;

/* ---- Impls for Sensors ---- */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SensorsData<M>(BTreeMap<SensorType, M>);

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
