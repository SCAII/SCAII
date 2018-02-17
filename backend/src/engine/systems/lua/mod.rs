use rlua::{Lua, Table};
use scaii_defs::protos::Error as ScaiiError;

use specs::prelude::*;

use std::error::Error;
use std::path::Path;
use std::fmt::Debug;

use engine::components::{Death, FactionId, UnitTypeTag};
use engine::resources::{Reward, RewardTypes, Skip, Terminal, UnitTypeMap};

pub(crate) mod userdata;

#[derive(SystemData)]
pub struct LuaSystemData<'a> {
    death: ReadStorage<'a, Death>,
    faction: ReadStorage<'a, FactionId>,
    tag: ReadStorage<'a, UnitTypeTag>,

    unit_type: Fetch<'a, UnitTypeMap>,
    r_types: Fetch<'a, RewardTypes>,

    skip: FetchMut<'a, Skip>,
    reward: FetchMut<'a, Reward>,
    terminal: FetchMut<'a, Terminal>,
}

pub struct LuaSystem {
    lua: Lua,
}

unsafe impl Send for LuaSystem {}

impl<'a> System<'a> for LuaSystem {
    type SystemData = LuaSystemData<'a>;

    fn run(&mut self, mut sys_data: Self::SystemData) {
        use self::userdata::{UserDataReadWorld, UserDataUnit, UserDataWorld};

        sys_data.reward.0.clear();

        let world = UserDataWorld::default();
        self.lua.globals().set("__sky_world", world).unwrap();

        for (faction, tag, death) in (&sys_data.faction, &sys_data.tag, &sys_data.death).join() {
            let killer_faction = sys_data.faction.get(death.killer).unwrap();
            let friendly_kill = faction == killer_faction;

            let unit1 = UserDataUnit { faction: *faction };
            let unit2 = UserDataUnit {
                faction: *killer_faction,
            };

            self.lua.globals().set("__sky_u1", unit1).unwrap();

            self.lua.globals().set("__sky_u2", unit2).unwrap();

            self.lua
                .exec::<()>(
                    "on_death(__sky_world, __sky_u1, __sky_u2)",
                    Some("calling on_death"),
                )
                .unwrap();

            let u_type = sys_data.unit_type.tag_map.get(&tag.0).unwrap();

            if (killer_faction.0 != 0 || friendly_kill) && u_type.death_penalty != 0.0 {
                *sys_data
                    .reward
                    .0
                    .entry(u_type.death_type.clone())
                    .or_insert(0.0) += u_type.death_penalty;
            } else if u_type.kill_reward != 0.0 {
                *sys_data
                    .reward
                    .0
                    .entry(u_type.kill_type.clone())
                    .or_insert(0.0) += u_type.kill_reward;
            }
        }

        let world: UserDataWorld = self.lua.globals().get("__sky_world").unwrap();
        if world.victory.is_some() {
            sys_data.terminal.0 = true;
        }

        let r_types = &sys_data.r_types.0;
        for (r_type, reward) in world.rewards {
            assert!(r_types.contains(&r_type));
            *sys_data.reward.0.entry(r_type).or_insert(0.0) += reward;
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
    }
}
impl LuaSystem {
    /// Creates a new `LuaSystem` with a new context.
    pub fn new() -> Self {
        LuaSystem { lua: Lua::new() }
    }

    /// Creates a new Lua system from the given context
    #[allow(dead_code)]
    pub fn from_lua(lua: Lua) -> Self {
        LuaSystem { lua: lua }
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

        let rng: *mut Isaac64Rng = &mut *world.write_resource();
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
    ) -> Result<(), Box<Error>> {
        use std::fs::File;
        use std::io::prelude::*;
        use self::userdata::UserDataRng;
        use rand::Isaac64Rng;

        let mut file = File::open(&path).or_else(|e| {
            Err(format!(
                "Could not load Lua file, is the path right?:\n\t{}",
                e
            ))
        })?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .expect("Could not read Lua contents");

        self.lua.exec::<()>(
            &contents,
            Some(&format!("Lua Scenario Script at path {:?}", path)),
        )?;

        let rng = &mut *world.write_resource::<Isaac64Rng>();
        let rng = UserDataRng { rng: rng };

        self.lua.globals().set("__sky_rts_rng", rng)?;

        Ok(())
    }

    pub fn reset(&mut self, world: &mut World) -> Result<(), Box<Error>> {
        use engine::components::Pos;
        use engine::resources::UnitTypeMap;

        let units: Table = self.lua
            .eval("sky_reset(__sky_rts_rng)", Some("Restart function"))?;

        for unit in units.sequence_values::<Table>() {
            let unit = unit?;
            let template: String = unit.get("unit_type")?;

            let pos_table: Table = unit.get("pos")?;
            let pos = Pos::new(pos_table.get("x")?, pos_table.get("y")?);

            let faction: usize = unit.get("faction")?;

            let template = {
                let unit_types = world.read_resource::<UnitTypeMap>();

                unit_types
                    .tag_map
                    .get(&template)
                    .ok_or_else(|| format!("Could not get unit type template {}", template))?
                    .clone()
            };

            template.build_entity(world, pos, faction);
        }

        Ok(())
    }

    pub fn load_scenario(&mut self, world: &mut World) -> Result<(), Box<Error>> {
        use engine::components::{FactionId, Shape};
        use engine::resources::{Player, RewardTypes, UnitType, UnitTypeMap, PLAYER_COLORS};
        use std::collections::HashSet;

        let table: Table = self.lua
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
                        } else
                        /* i.e. triangle */
                        {
                            Shape::Triangle {
                                base_len: shape_table.get("base_len")?,
                            }
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

            world.write_resource::<RewardTypes>().0 = r_types;
        }

        Ok(())
    }
}
