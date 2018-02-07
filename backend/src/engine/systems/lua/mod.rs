use rlua::{Lua, Table};
use scaii_defs::protos::Error as ScaiiError;

use specs::{Fetch, FetchMut, ReadStorage, System, World};

use std::error::Error;
use std::path::Path;
use std::fmt::Debug;

use engine::components::{Death, FactionId, UnitTypeTag};
use engine::resources::{Reward, Skip, Terminal, UnitTypeMap};

pub(crate) mod userdata;

#[derive(SystemData)]
pub struct LuaSystemData<'a> {
    death: ReadStorage<'a, Death>,
    faction: ReadStorage<'a, FactionId>,
    tag: ReadStorage<'a, UnitTypeTag>,

    unit_type: Fetch<'a, UnitTypeMap>,

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
        use specs::Join;
        use self::userdata::{UserDataReadWorld, UserDataUnit, UserDataWorld};

        sys_data.reward.0.clear();

        let world = UserDataWorld { victory: None };
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

            if killer_faction.0 != 0 || friendly_kill {
                *sys_data.reward.0.entry("death".to_string()).or_insert(0.0) +=
                    u_type.death_penalty;
            } else {
                *sys_data.reward.0.entry("kill".to_string()).or_insert(0.0) += u_type.kill_reward;
            }
        }

        let world: UserDataWorld = self.lua.globals().get("__sky_world").unwrap();
        if world.victory.is_some() {
            sys_data.terminal.0 = true;
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
    pub fn new() -> Self {
        LuaSystem { lua: Lua::new() }
    }

    pub fn from_lua(lua: Lua) -> Self {
        LuaSystem { lua: lua }
    }

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
        use engine::resources::{Player, UnitType, UnitTypeMap, PLAYER_COLORS};

        let table: Table = self.lua
            .eval("sky_init()", Some("Initializing in sky_init from Lua"))?;

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

                u_type_map.typ_ids.insert(concrete.tag.clone(), i);
                u_type_map.tag_map.insert(concrete.tag.clone(), concrete);
            }
        }

        Ok(())
    }
}
