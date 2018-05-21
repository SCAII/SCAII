use rlua::{UserData, UserDataMethods};

use engine::components::{FactionId, Hp, Pos};
use engine::resources::Spawn;

use std::collections::HashMap;

use rand::Rng;

/// This is a workaround for Lua not having any serializable elements,
/// and no clear semantics to serialize a `Table` object. This may be reworked
/// later with a better API based around a custom foreign serialization implementation
/// for Table and other Lua types.
#[derive(Serialize, Deserialize, Clone, PartialEq, Debug, Default)]
pub struct DataStore {
    int_data: HashMap<String, i64>,
    float_data: HashMap<String, f64>,
    string_data: HashMap<String, String>,
    bool_data: HashMap<String, bool>,
}

impl DataStore {
    fn remove_key(&mut self, idx: &str) {
        self.int_data.remove(idx);
        self.float_data.remove(idx);
        self.string_data.remove(idx);
        self.bool_data.remove(idx);
    }

    pub fn len(&self) -> usize {
        self.int_data.len() + self.float_data.len() + self.string_data.len() + self.bool_data.len()
    }

    pub fn display_all(&self, out: Option<HashMap<String, String>>) -> HashMap<String, String> {
        let mut out = out.unwrap_or_else(|| HashMap::with_capacity(self.len()));
        out.clear();

        let iter = self.int_data
            .iter()
            .map(|(k, v)| (k.clone(), format!("{}", v)));
        out.extend(iter);

        let iter = self.float_data
            .iter()
            .map(|(k, v)| (k.clone(), format!("{}", v)));
        out.extend(iter);

        let iter = self.bool_data
            .iter()
            .map(|(k, v)| (k.clone(), format!("{}", v)));
        out.extend(iter);

        // Iter.cloned doesn't play nice with hash map's iter method for some reason
        out.extend(self.string_data.iter().map(|(k, v)| (k.clone(), v.clone())));

        out
    }
}

impl UserData for DataStore {
    fn add_methods(methods: &mut UserDataMethods<Self>) {
        use rlua::{MetaMethod, Value};
        use rlua::String as LuaString;

        methods.add_meta_method(MetaMethod::Index, |lua, this, idx: LuaString| {
            let idx = idx.to_str()?;

            if let Some(val) = this.int_data.get(idx) {
                Ok(Value::Integer(*val))
            } else if let Some(val) = this.float_data.get(idx) {
                Ok(Value::Number(*val))
            } else if let Some(val) = this.string_data.get(idx) {
                Ok(Value::String(lua.create_string(val)?))
            } else if let Some(val) = this.bool_data.get(idx) {
                Ok(Value::Boolean(*val))
            } else {
                panic!("Lua used unexpected index {:?}", idx);
            }
        });

        methods.add_meta_method_mut(
            MetaMethod::NewIndex,
            |_, this, (idx, val): (LuaString, Value)| {
                let idx = idx.to_str()?;

                this.remove_key(idx);

                match val {
                    Value::Integer(val) => {
                        this.int_data.insert(idx.to_string(), val);
                    }
                    Value::Number(val) => {
                        this.float_data.insert(idx.to_string(), val);
                    }
                    Value::Boolean(val) => {
                        this.bool_data.insert(idx.to_string(), val);
                    }
                    Value::String(val) => {
                        this.string_data
                            .insert(idx.to_string(), val.to_str()?.to_string());
                    }
                    Value::Nil => {
                        // ... do nothing, we interpret writing nil as deleting a key
                    }
                    _ => panic!("Unsupported type"), // todo, change when we upgrade to failure
                };

                Ok(())
            },
        );
    }
}

#[derive(Copy, Clone)]
pub struct UserDataRng<R: Rng + 'static> {
    pub rng: *mut R,
}

unsafe impl<R: Rng + 'static> Send for UserDataRng<R> {}

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

#[cfg(test)]
mod tests {
    use rlua::Lua;

    const SETUP_PROGRAM: &'static str = r#"store.x = 5
store.a_bool = true
store.str = "hello"
store.pi = 3.14"#;

    fn setup_data_store() -> Lua {
        use super::DataStore;

        let lua = Lua::new();
        lua.globals().set("store", DataStore::default()).unwrap();

        lua.exec::<()>(SETUP_PROGRAM, Some("Data Store")).unwrap();

        lua
    }

    #[test]
    fn lua_data_store_add() {
        use super::DataStore;

        let lua = setup_data_store();
        let store: DataStore = lua.globals().get("store").unwrap();

        assert_eq!(store.int_data.get("x"), Some(&5));
        assert_eq!(store.float_data.get("pi"), Some(&3.14));
        assert_eq!(store.bool_data.get("a_bool"), Some(&true));
        assert_eq!(store.string_data.get("str").map(|s| &**s), Some("hello"));
    }

    #[test]
    fn lua_data_store_remove() {
        use super::DataStore;

        let lua = setup_data_store();

        lua.exec::<()>("store.pi = nil", Some("remove")).unwrap();

        let store: DataStore = lua.globals().get("store").unwrap();

        assert!(store.float_data.get("pi").is_none());
    }

    #[test]
    fn lua_data_store_replace() {
        use super::DataStore;

        let lua = setup_data_store();

        lua.exec::<()>("store.pi = 12", Some("replace")).unwrap();

        let store: DataStore = lua.globals().get("store").unwrap();

        assert!(store.float_data.get("pi").is_none());
        assert_eq!(store.int_data.get("pi"), Some(&12));
    }

    #[test]
    fn lua_data_store_read() {
        use rlua::Number;

        let lua = setup_data_store();

        let pi = lua.exec::<Number>("return store.pi", Some("read")).unwrap();

        assert_eq!(pi, 3.14);
    }
}
