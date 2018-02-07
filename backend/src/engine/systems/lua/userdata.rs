use rlua::{UserData, UserDataMethods};

use engine::components::FactionId;

use rand::Rng;

pub struct UserDataRng<R: Rng + 'static> {
    pub rng: *mut R,
}

impl<R: Rng + 'static> UserData for UserDataRng<R> {
    fn add_methods(methods: &mut UserDataMethods<Self>) {
        methods.add_method("rand_int", |_, this, (min, max): (i64, i64)| unsafe {
            Ok((*this.rng).gen_range::<i64>(min, max))
        });

        methods.add_method("rand_double", |_, this, (min, max): (f64, f64)| unsafe {
            Ok((*this.rng).gen_range::<f64>(min, max))
        });
    }
}

#[derive(Clone, Eq, PartialEq, Ord, PartialOrd, Hash, Default, Debug)]
pub struct UserDataWorld {
    pub victory: Option<FactionId>,
}

impl UserData for UserDataWorld {
    fn add_methods(methods: &mut UserDataMethods<Self>) {
        methods.add_method_mut("victory", |_, this, faction: usize| {
            this.victory = Some(FactionId(faction));
            Ok(())
        });
    }
}

#[derive(Clone, Eq, PartialEq, Ord, PartialOrd, Hash, Default, Debug)]
pub struct UserDataReadWorld;

impl UserData for UserDataReadWorld {}

#[derive(Clone, Eq, PartialEq, Ord, PartialOrd, Hash, Default, Debug)]
pub struct UserDataUnit {
    pub faction: FactionId,
}

impl UserData for UserDataUnit {
    fn add_methods(methods: &mut UserDataMethods<Self>) {
        methods.add_method("faction", |_, this, ()| Ok(this.faction.0));
    }
}
