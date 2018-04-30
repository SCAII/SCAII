use rlua::{UserData, UserDataMethods};

use engine::components::{FactionId, Hp, Pos};
use engine::resources::Spawn;

use std::collections::HashMap;

use rand::Rng;

#[derive(Copy, Clone)]
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

#[derive(Clone)]
pub struct UserDataWorld<R: Rng + 'static> {
    pub victory: Option<FactionId>,
    pub rewards: HashMap<String, f64>,
    pub override_skip: bool,
    pub spawn: Vec<Spawn>,
    pub delete_all: bool,
    pub rng: UserDataRng<R>,
}

impl<R: Rng + 'static> UserDataWorld<R> {
    pub fn new(rng: UserDataRng<R>) -> Self {
        UserDataWorld {
            victory: Default::default(),
            rewards: Default::default(),
            override_skip: false,
            spawn: vec![],
            delete_all: false,
            rng,
        }
    }
}

impl<R: Rng + 'static> UserData for UserDataWorld<R> {
    fn add_methods(methods: &mut UserDataMethods<Self>) {
        use rlua::Table;

        methods.add_method_mut("victory", |_, this, faction: usize| {
            this.victory = Some(FactionId(faction));
            Ok(())
        });

        methods.add_method_mut("emit_reward", |_, this, (reward, r_type): (f64, String)| {
            *this.rewards.entry(r_type).or_insert(0.0) += reward;
            Ok(())
        });

        methods.add_method_mut("override_skip", |_, this, val: bool| {
            this.override_skip = val;
            Ok(())
        });

        methods.add_method_mut("spawn", |_, this, to_spawn: Table| {
            let pos: Table = to_spawn.get("pos").unwrap();
            let pos = Pos::new(pos.get("x").unwrap(), pos.get("y").unwrap());

            let spawn = Spawn {
                delay: to_spawn.get("delay").unwrap_or(0),
                pos: pos,
                curr_hp: to_spawn.get("hp").ok(),
                faction: to_spawn.get("faction").unwrap(),
                u_type: to_spawn.get("unit_type").unwrap(),
            };

            this.spawn.push(spawn);
            Ok(())
        });

        methods.add_method_mut("delete_all", |_, this, ()| {
            this.delete_all = true;
            Ok(())
        });

        // Don't ask me why, but just returning this.rng doesn't work even though
        // it's Copy.
        methods.add_method("rng", |_, this, ()| Ok(UserDataRng { rng: this.rng.rng }))
    }
}

#[derive(Clone, Eq, PartialEq, Ord, PartialOrd, Hash, Default, Debug)]
pub struct UserDataReadWorld;

impl UserData for UserDataReadWorld {}

#[derive(Clone, PartialEq, Default, Debug)]
pub struct UserDataUnit {
    pub faction: FactionId,
    pub u_type: String,
    pub hp: Hp,
}

impl UserData for UserDataUnit {
    fn add_methods(methods: &mut UserDataMethods<Self>) {
        methods.add_method("faction", |_, this, ()| Ok(this.faction.0));
        methods.add_method("unit_type", |_, this, ()| Ok(this.u_type.clone()));
        methods.add_method("hp", |_, this, ()| Ok(this.hp.curr_hp));
    }
}
