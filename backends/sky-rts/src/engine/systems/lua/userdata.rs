use rlua::{UserData, UserDataMethods};

use engine::components::FactionId;

use std::collections::HashMap;

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

#[derive(Clone, PartialEq, Default, Debug)]
pub struct UserDataWorld {
    pub victory: Option<FactionId>,
    pub rewards: HashMap<String, f64>,
}

impl UserData for UserDataWorld {
    fn add_methods(methods: &mut UserDataMethods<Self>) {
        methods.add_method_mut("victory", |_, this, faction: usize| {
            this.victory = Some(FactionId(faction));
            Ok(())
        });

        methods.add_method_mut("emit_reward", |_, this, (reward, r_type): (f64, String)| {
            *this.rewards.entry(r_type).or_insert(0.0) += reward;
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
