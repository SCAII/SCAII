use rlua::{Lua, Table};
use scaii_defs::protos::Error as ScaiiError;

use specs::prelude::*;

use rlua::Error;
use std::fmt::Debug;
use std::path::Path;

use engine::components::{
    DataStoreComponent, DealtDamage, Death, Delete, FactionId, Hp, HpChange, Spawned, UnitTypeTag,
};
use engine::resources::{
    CumReward, DataStore, MaxStep, Reward, RewardTypes, Skip, SpawnBuffer, Step, Terminal,
    UnitTypeMap, WorldRng,
};

use rand::Isaac64Rng;

use std::collections::HashMap;

pub(crate) mod userdata;

#[derive(SystemData)]
pub struct LuaSystemData<'a> {
    death: ReadStorage<'a, Death>,
    faction: ReadStorage<'a, FactionId>,
    tag: ReadStorage<'a, UnitTypeTag>,
    dmg_dealt: ReadStorage<'a, DealtDamage>,
    hp_change: ReadStorage<'a, HpChange>,
    hp: ReadStorage<'a, Hp>,
    spawned: ReadStorage<'a, Spawned>,
    ids: Entities<'a>,
    global_lua_data: Write<'a, DataStore>,
    lua_data: WriteStorage<'a, DataStoreComponent>,

    step: Read<'a, Step>,
    max_step: Read<'a, MaxStep>,
    unit_type: Read<'a, UnitTypeMap>,
    r_types: Read<'a, RewardTypes>,

    skip: Write<'a, Skip>,
    reward: Write<'a, Reward>,
    terminal: Write<'a, Terminal>,
    spawn_buf: Write<'a, SpawnBuffer>,
    rng: Write<'a, WorldRng>,
    delete: WriteStorage<'a, Delete>,
    cum_reward: Write<'a, CumReward>,
}

pub struct LuaSystem {
    lua: Lua,
    immediate_reward: HashMap<String, f64>,
}

unsafe impl Send for LuaSystem {}

impl<'a> System<'a> for LuaSystem {
    type SystemData = LuaSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        use self::userdata::{UserDataReadWorld, UserDataRng, UserDataUnit, UserDataWorld};

        self.immediate_reward.clear();
        let world = UserDataWorld::new(
            UserDataRng {
                rng: &mut sys_data.rng.0,
            },
            &mut *sys_data.global_lua_data,
        );
        self.lua.globals().set("__sky_world", world).unwrap();

        // Need to do a borrow checker workaround because we're
        // doing a disjoint borrow of the same component mutable on two
        // entities
        //
        // Specs may have a better fix later
        for (faction, tag, hp, death, id) in (
            &sys_data.faction,
            &sys_data.tag,
            &sys_data.hp,
            &sys_data.death,
            &*sys_data.ids,
        ).join()
        {
            let lua_data: *mut _ = &mut sys_data.lua_data.get_mut(id).unwrap().0;

            let killer_faction = sys_data.faction.get(death.killer).unwrap();
            let killer_tag = sys_data.tag.get(death.killer).unwrap();
            let killer_hp = sys_data.hp.get(death.killer).unwrap();
            let killer_lua_data: *mut _ = &mut sys_data.lua_data.get_mut(death.killer).unwrap().0;

            let unit1 = UserDataUnit {
                faction: *faction,
                u_type: tag.0.clone(),
                hp: *hp,
                data_store: lua_data,
            };
            let unit2 = UserDataUnit {
                faction: *killer_faction,
                u_type: killer_tag.0.clone(),
                hp: *killer_hp,
                data_store: killer_lua_data,
            };

            self.lua.globals().set("__sky_u1", unit1.clone()).unwrap();

            self.lua.globals().set("__sky_u2", unit2).unwrap();

            self.lua
                .exec::<()>(
                    "on_death(__sky_world, __sky_u1, __sky_u2)",
                    Some("calling on_death"),
                )
                .unwrap();

            let dead_type = sys_data.unit_type.tag_map.get(&unit1.u_type).unwrap();

            if faction.0 == 0 && dead_type.death_penalty != 0.0 {
                *self
                    .immediate_reward
                    .entry(dead_type.death_type.clone())
                    .or_insert(0.0) += dead_type.death_penalty;
            } else if faction.0 == 1 && killer_faction.0 == 0 && dead_type.kill_reward != 0.0 {
                *self
                    .immediate_reward
                    .entry(dead_type.kill_type.clone())
                    .or_insert(0.0) += dead_type.kill_reward;
            }
        }

        for (faction, u_type, hp, _, lua_data) in (
            &sys_data.faction,
            &sys_data.tag,
            &sys_data.hp,
            &sys_data.spawned,
            &mut sys_data.lua_data,
        ).join()
        {
            let unit = UserDataUnit {
                faction: *faction,
                u_type: u_type.0.clone(),
                hp: *hp,
                data_store: &mut lua_data.0,
            };

            self.lua.globals().set("__sky_u1", unit).unwrap();
            self.lua
                .exec::<()>("on_spawn(__sky_world, __sky_u1)", Some("calling on_spawn"))
                .unwrap();
        }

        for (dmg_dealt, tag, _) in (&sys_data.dmg_dealt, &sys_data.tag, &sys_data.faction)
            .join()
            .filter(|&(_, _, faction)| faction.0 == 0)
        {
            let u_type = sys_data.unit_type.tag_map.get(&tag.0).unwrap();

            if u_type.damage_deal_reward.is_none() {
                let enemy_dmg: f64 = dmg_dealt
                    .by_source
                    .iter()
                    .filter_map(|d| if (d.1).0 != 0 { Some(d.0) } else { None })
                    .sum();

                *self
                    .immediate_reward
                    .entry(u_type.dmg_deal_type.clone())
                    .or_insert(0.0) += enemy_dmg
            } else if u_type.damage_deal_reward.unwrap() != 0.0 {
                let enemy_dmg_ct = dmg_dealt.by_source.iter().filter(|d| (d.1).0 != 0).count();

                *self
                    .immediate_reward
                    .entry(u_type.dmg_deal_type.clone())
                    .or_insert(0.0) += (enemy_dmg_ct as f64) * u_type.damage_deal_reward.unwrap();
            }
        }

        for (hp_change, tag, _) in (&sys_data.hp_change, &sys_data.tag, &sys_data.faction)
            .join()
            .filter(|&(_, _, faction)| faction.0 == 0)
        {
            let u_type = sys_data.unit_type.tag_map.get(&tag.0).unwrap();

            if u_type.damage_recv_penalty.is_none() {
                *self
                    .immediate_reward
                    .entry(u_type.dmg_recv_type.clone())
                    .or_insert(0.0) += hp_change.0
            } else if u_type.damage_recv_penalty.unwrap() != 0.0 {
                *self
                    .immediate_reward
                    .entry(u_type.dmg_recv_type.clone())
                    .or_insert(0.0) += u_type.damage_recv_penalty.unwrap();
            }
        }

        let mut world: UserDataWorld<Isaac64Rng> = self.lua.globals().get("__sky_world").unwrap();
        if world.victory.is_some() {
            sys_data.terminal.0 = true;
        }

        if world.delete_all {
            for id in sys_data.ids.join() {
                if sys_data.death.get(id).is_some() {
                    continue;
                }
                sys_data.delete.insert(id, Delete);
            }
        }

        let r_types = &sys_data.r_types.0;
        for (r_type, reward) in world.rewards {
            assert!(r_types.contains(&r_type));
            *self.immediate_reward.entry(r_type).or_insert(0.0) += reward;
        }

        sys_data.spawn_buf.0.extend(world.spawn.drain(..));

        if sys_data
            .max_step
            .0
            .map(|v| sys_data.step.0 >= v)
            .unwrap_or(false)
        {
            sys_data.terminal.0 = true;
        }

        if world.override_skip {
            *sys_data.skip = Skip(false, None);
        }

        if sys_data.skip.0 {
            if sys_data.terminal.0 {
                *sys_data.skip = Skip(false, None);
            } else if let Some(ref src) = sys_data.skip.1 {
                self.lua
                    .globals()
                    .set("__sky_read_world", UserDataReadWorld)
                    .unwrap();
                self.lua
                    .exec::<()>(src, Some("Skip lua"))
                    .expect("Could not execute lua to skip current state");
            }
        }

        for (r_type, reward) in &self.immediate_reward {
            *sys_data.reward.0.entry(r_type.clone()).or_insert(0.0) += reward;
            *sys_data
                .cum_reward
                .0
                .get_mut(r_type)
                .expect(&format!("No r_type named {} ?", r_type)) += reward;
        }
    }
}
impl LuaSystem {
    /// Creates a new `LuaSystem` with a new context.
    pub fn new() -> Self {
        LuaSystem {
            lua: Lua::new(),
            immediate_reward: HashMap::default(),
        }
    }

    /// Creates a new Lua system from the given context
    #[allow(dead_code)]
    pub fn from_lua(lua: Lua) -> Self {
        LuaSystem {
            lua: lua,
            immediate_reward: HashMap::default(),
        }
    }

    /// Executes a Lua script in the current Lua context, loading any
    /// functions. Returns an error if Lua fails.
    #[allow(dead_code)]
    pub fn add_lua(&mut self, src: &str) -> Result<(), ScaiiError> {
        self.lua
            .exec::<()>(src, Some("Loading Scenario Script File"))
            .or_else(|e| {
                Err(ScaiiError {
                    fatal: Some(true),
                    error_info: None,
                    description: format!("Cannot execute scenario description lua file:\n\t{}", e),
                })
            })
    }

    /// Resets the raw pointer the the engine RNG that the Lua
    /// environment may use as arguments to user-functions.
    #[allow(dead_code)]
    pub fn reset_rng_ptr(&mut self, world: &mut World) {
        use self::userdata::UserDataRng;
        use rand::Isaac64Rng;

        let rng: *mut Isaac64Rng = &mut world.write_resource::<WorldRng>().0;
        let rng = UserDataRng { rng: rng };

        self.lua
            .globals()
            .set("__sky_rts_rng", rng)
            .expect("Could not set world RNG as Lua global");
    }

    pub fn init<P: AsRef<Path> + Debug>(
        &mut self,
        world: &mut World,
        path: P,
    ) -> Result<(), Error> {
        use self::userdata::UserDataRng;
        use rand::Isaac64Rng;
        use std::fs::File;
        use std::io::prelude::*;

        let mut file = File::open(&path).or_else(|e| {
            Err(Error::external(e))
            // TODO: Fix after we can import the failure crate directly
            // "Could not load Lua file, is the path right?:\n\t{}"
        })?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .expect("Could not read Lua contents");

        self.lua.exec::<()>(
            &contents,
            Some(&format!("Lua Scenario Script at path {:?}", path)),
        )?;

        let rng = &mut world.write_resource::<WorldRng>().0;
        let rng = UserDataRng { rng: rng };

        self.lua.globals().set("__sky_rts_rng", rng)?;

        Ok(())
    }

    pub fn reset(&mut self, world: &mut World) -> Result<(), Error> {
        use engine::components::Pos;
        use engine::resources::UnitTypeMap;

        let units: Table = self
            .lua
            .eval("sky_reset(__sky_rts_rng)", Some("Restart function"))?;

        for unit in units.sequence_values::<Table>() {
            let unit = unit?;
            let template: String = unit.get("unit_type")?;

            let pos_table: Table = unit.get("pos")?;
            let pos = Pos::new(pos_table.get("x")?, pos_table.get("y")?);

            let curr_hp: Option<f64> = unit.get("hp")?;

            let faction: usize = unit.get("faction")?;

            let template = {
                let unit_types = world.read_resource::<UnitTypeMap>();

                unit_types
                    .tag_map
                    .get(&template)
                    .unwrap()
                    // TODO fix after we add the failure crate
                    // .ok_or_else(|| format!("Could not get unit type template {}", template))?
                    .clone()
            };

            template.build_entity(world, pos, curr_hp, faction);
        }

        Ok(())
    }

    pub fn load_scenario(&mut self, world: &mut World) -> Result<(), Error> {
        use engine::components::{FactionId, Shape};
        use engine::resources::{
            CumReward, MaxStep, Player, RewardTypes, UnitType, UnitTypeMap, PLAYER_COLORS,
        };
        use std::collections::HashSet;

        let table: Table = self
            .lua
            .eval("sky_init()", Some("Initializing in sky_init from Lua"))?;

        let r_types = if table.contains_key("reward_types")? {
            let reward_types: Table = table.get("reward_types")?;
            let mut r_types = HashSet::new();
            for r_type in reward_types.sequence_values::<String>() {
                r_types.insert(r_type?);
            }

            r_types
        } else {
            RewardTypes::default().0
        };

        let factions: usize = if table.contains_key("factions")? {
            table.get("factions").unwrap()
        } else {
            2
        };

        {
            let players = &mut *world.write_resource::<Vec<Player>>();
            for faction in 0..factions {
                players.push(Player {
                    color: PLAYER_COLORS[faction],
                    id: FactionId(faction),
                })
            }
        }

        world.write_resource::<MaxStep>().0 = table.get("max_steps")?;

        {
            let unit_types: Table = table.get("unit_types")?;

            let u_type_map = &mut *world.write_resource::<UnitTypeMap>();

            let default = UnitType::default();

            for (i, unit_type) in unit_types.sequence_values::<Table>().enumerate() {
                let unit_type = unit_type?;

                let mut concrete = UnitType {
                    tag: if unit_type.contains_key("tag")? {
                        unit_type.get("tag")?
                    } else {
                        default.tag.clone()
                    },
                    max_hp: if unit_type.contains_key("max_hp")? {
                        unit_type.get("max_hp")?
                    } else {
                        default.max_hp
                    },
                    movable: if unit_type.contains_key("can_move")? {
                        unit_type.get("can_move")?
                    } else {
                        default.movable
                    },
                    damage_deal_reward: if unit_type.contains_key("damage_deal_reward")? {
                        unit_type.get("damage_deal_reward")?
                    } else {
                        default.damage_deal_reward
                    },
                    damage_recv_penalty: if unit_type.contains_key("damage_recv_penalty")? {
                        unit_type.get("damage_recv_penalty")?
                    } else {
                        default.damage_recv_penalty
                    },
                    shape: if unit_type.contains_key("shape")? {
                        let shape_table: Table = unit_type.get("shape")?;
                        let body: String = shape_table.get("body")?;
                        if body == "rect" {
                            Shape::Rect {
                                width: shape_table.get("width")?,
                                height: shape_table.get("height")?,
                            }
                        } else if body == "triangle" {
                            Shape::Triangle {
                                base_len: shape_table.get("base_len")?,
                            }
                        } else if body == "circle" {
                            Shape::Circle {
                                radius: shape_table.get("radius")?,
                            }
                        } else {
                            panic!("Unknown shape {}", body)
                        }
                    } else {
                        default.shape
                    },
                    speed: if unit_type.contains_key("speed")? {
                        unit_type.get("speed")?
                    } else {
                        default.speed
                    },
                    attack_range: if unit_type.contains_key("attack_range")? {
                        unit_type.get("attack_range")?
                    } else {
                        default.attack_range
                    },
                    attack_delay: if unit_type.contains_key("attack_delay")? {
                        unit_type.get("attack_delay")?
                    } else {
                        default.attack_delay
                    },
                    attack_damage: if unit_type.contains_key("attack_dmg")? {
                        unit_type.get("attack_dmg")?
                    } else {
                        default.attack_damage
                    },
                    ..UnitType::default()
                };

                let kill_reward = unit_type.get("kill_reward")?;
                let death_penalty = unit_type.get("death_penalty")?;

                match (kill_reward, death_penalty) {
                    (Some(kr), Some(dp)) => {
                        concrete.kill_reward = kr;
                        concrete.death_penalty = dp
                    }
                    (Some(kr), None) => {
                        concrete.kill_reward = kr;
                        concrete.death_penalty = -kr
                    }
                    (None, Some(dp)) => {
                        concrete.kill_reward = -dp;
                        concrete.death_penalty = dp
                    }
                    (None, None) => {
                        concrete.kill_reward = default.kill_reward;
                        concrete.death_penalty = default.death_penalty
                    }
                }

                if concrete.kill_reward != 0.0 {
                    concrete.kill_type = if unit_type.contains_key("kill_type")? {
                        let typ: String = unit_type.get("kill_type")?;
                        if !r_types.contains(&typ) {
                            panic!(
                                "Got reward type \"{}\" but only recognize {:?}",
                                typ, r_types
                            );
                        }
                        typ
                    } else {
                        if !r_types.contains(&concrete.kill_type) {
                            panic!(
                                "Got default reward type \"{}\" but expected one of {:?}",
                                concrete.kill_type, r_types
                            );
                        }
                        concrete.kill_type
                    };
                }

                if concrete.death_penalty != 0.0 {
                    concrete.death_type = if unit_type.contains_key("death_type")? {
                        let typ: String = unit_type.get("death_type")?;
                        if !r_types.contains(&typ) {
                            panic!(
                                "Got reward type \"{}\" but only recognize {:?}",
                                typ, r_types
                            );
                        }
                        typ
                    } else {
                        if !r_types.contains(&concrete.death_type) {
                            panic!(
                                "Got default reward type \"{}\" but expected one of {:?}",
                                concrete.death_type, r_types
                            );
                        }
                        concrete.death_type
                    };
                }

                if concrete.damage_recv_penalty != Some(0.0) {
                    concrete.dmg_recv_type = if unit_type.contains_key("dmg_recv_type")? {
                        let typ: String = unit_type.get("dmg_recv_type")?;
                        if !r_types.contains(&typ) {
                            panic!(
                                "Got reward type \"{}\" but only recognize {:?}",
                                typ, r_types
                            );
                        }
                        typ
                    } else {
                        if !r_types.contains(&concrete.dmg_recv_type) {
                            panic!(
                                "Got default reward type \"{}\" but expected one of {:?}",
                                concrete.dmg_recv_type, r_types
                            );
                        }
                        concrete.dmg_recv_type
                    };
                }

                if concrete.damage_deal_reward != Some(0.0) {
                    concrete.dmg_deal_type = if unit_type.contains_key("dmg_deal_type")? {
                        let typ: String = unit_type.get("dmg_deal_type")?;
                        if !r_types.contains(&typ) {
                            panic!(
                                "Got reward type \"{}\" but only recognize {:?}",
                                typ, r_types
                            );
                        }
                        typ
                    } else {
                        if !r_types.contains(&concrete.dmg_deal_type) {
                            panic!(
                                "Got default reward type \"{}\" but expected one of {:?}",
                                concrete.dmg_deal_type, r_types
                            );
                        }
                        concrete.dmg_deal_type
                    };
                }

                u_type_map.typ_ids.insert(concrete.tag.clone(), i);
                u_type_map.tag_map.insert(concrete.tag.clone(), concrete);
            }

            let cum_reward = &mut world.write_resource::<CumReward>().0;
            // IsEmpty is a safety hatch for deserializing, we won't overwrite it
            // if there's info there
            if cum_reward.is_empty() {
                for r_type in r_types.iter() {
                    cum_reward.insert(r_type.clone(), 0.0);
                }
            }

            world.write_resource::<RewardTypes>().0 = r_types;
        }

        Ok(())
    }
}
