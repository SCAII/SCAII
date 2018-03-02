// Copyright 2017-2018 The SCAII Developers.
//
// Licensed under the 3-Clause BSD license
// <BSD-3-Clause or https://opensource.org/licenses/BSD-3-Clause>
// This file may not be copied, modified, or distributed
// except according to those terms.
//! Contains the top-level RTS definition.
//!
//! This provides high-level to the RTS, including
//! initializing, updating, and configuring it.

pub mod components;
pub mod systems;
pub mod resources;

use self::resources::*;

use scaii_defs::protos::{Action, MultiMessage, ScaiiPacket};

use specs::prelude::*;

use self::components::FactionId;
use self::systems::lua::LuaSystem;
use self::systems::serde::{DeserializeSystem, RedoCollisionSys, SerializeSystem};

/// This contains the `specs` system and world context
/// for running an RTS game, as well as a few flags controlling
/// program flow.
pub struct Rts<'a, 'b> {
    world: World,
    pub initialized: bool,
    pub render: bool,

    sim_systems: Dispatcher<'a, 'b>,
    lua_sys: LuaSystem,
    out_systems: Dispatcher<'a, 'b>,

    ser_system: SerializeSystem,
    de_system: DeserializeSystem,
    redo_col_sys: RedoCollisionSys,

    frames_since_keyframe: usize,
    keyframe_interval: Option<usize>,
    last_action: Action,
}

impl<'a, 'b> Rts<'a, 'b> {
    /// Initializes a new RTS with all systems, components, and resources.
    pub fn new() -> Self {
        use self::systems::{AttackSystem, CleanupSystem, CollisionSystem, InputSystem, MoveSystem,
                            RenderSystem, StateBuildSystem};
        use std::sync::Arc;
        use rayon::ThreadPoolBuilder;

        let mut world = World::new();
        components::register_world_components(&mut world);
        resources::register_world_resources(&mut world);

        let pool = Arc::new(
            ThreadPoolBuilder::new()
                .num_threads(1)
                .build()
                .expect("Could not create thread pool"),
        );

        let simulation_builder: Dispatcher = DispatcherBuilder::new()
            .with_pool(pool.clone())
            .add(InputSystem::new(), "input", &[])
            .add(MoveSystem::new(), "movement", &["input"])
            .add(CollisionSystem, "collision", &["movement"])
            .add(AttackSystem, "attack", &["collision"])
            .build();

        let output_builder = DispatcherBuilder::new()
            .with_pool(pool)
            .add(RenderSystem {}, "render", &[])
            .add(CleanupSystem, "cleanup", &["render"])
            .add(StateBuildSystem::new(), "state", &["cleanup"])
            .build();

        let lua_sys = LuaSystem::new();

        Rts {
            world,
            lua_sys,
            initialized: false,
            render: false,
            sim_systems: simulation_builder,
            out_systems: output_builder,
            ser_system: SerializeSystem,
            de_system: DeserializeSystem,
            redo_col_sys: RedoCollisionSys,
            frames_since_keyframe: 0,
            keyframe_interval: None,
            last_action: Default::default(),
        }
    }

    pub fn replay_mode(&mut self, mode: bool) {
        use engine::resources::ReplayMode;
        self.world.write_resource::<ReplayMode>().0 = mode;
    }

    /// Causes the random number state to diverge
    /// so that if, say, the RTS had previously been
    /// serialized at this state before calling this function,
    /// identical inputs will cause different behavior.
    pub fn diverge(&mut self) {
        use rand::Isaac64Rng;
        use util;

        let rng = &mut *self.world.write_resource::<Isaac64Rng>();
        util::diverge(rng);
    }

    /// Changes the path to the scenario file. This function
    /// assumes the file is in `$HOME/.scaii/backends/sky-rts/maps` and ends
    /// in `.lua`, do not provide those parts of the path.
    ///
    /// So, for instance, if you have a scenario called `my_scenario.lua`
    /// in `$HOME/.scaii/backends/sky-rts/maps/foo/`, pass in simply
    /// `foo/my_scenario`.
    pub fn set_lua_path(&mut self, path: &str) {
        self.world.write_resource::<LuaPath>().0 =
            Some(format!(".scaii/backends/sky-rts/maps/{}.lua", path));
    }

    /// Initializes the scenario so that games can be reset.
    ///
    /// This loads Lua and well as running the scenario's `init`
    /// function, seeding things like unit types and settings.
    pub fn init(&mut self) -> MultiMessage {
        use engine::resources::LuaPath;
        use SUPPORTED;

        use std::env;
        use std::path::PathBuf;

        use scaii_defs::protos;
        use scaii_defs::protos::{EnvDescription, ScaiiPacket};

        if self.initialized {
            panic!("Double initialize in RTS");
        }

        self.initialized = true;

        let lua_path = self.world
            .read_resource::<LuaPath>()
            .0
            .as_ref()
            .and_then(|v| {
                Some(PathBuf::from(format!(
                    "{}/{}",
                    env::var("HOME").unwrap(),
                    &v
                )))
            });

        self.lua_sys
            .init(&mut self.world, lua_path.expect("No Lua file loaded"))
            .expect("Could not load Lua file");

        self.lua_sys
            .load_scenario(&mut self.world)
            .expect("Could not initialize scenario");

        if self.world.read_resource::<ReplayMode>().0 {
            return Default::default();
        }

        let scaii_packet = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(protos::endpoint::Endpoint::Backend(
                    protos::BackendEndpoint {},
                )),
            },
            dest: protos::Endpoint {
                endpoint: Some(protos::endpoint::Endpoint::Agent(protos::AgentEndpoint {})),
            },

            specific_msg: Some(protos::scaii_packet::SpecificMsg::EnvDesc(EnvDescription {
                reward_types: self.world
                    .read_resource::<RewardTypes>()
                    .0
                    .iter()
                    .map(|v| (v.clone(), true))
                    .collect(),
                supported: SUPPORTED.to_proto(),
                action_desc: Some("MoveList -- unit ID, command, and target ".to_string()),
                ..Default::default()
            })),
        };

        MultiMessage {
            packets: vec![scaii_packet],
        }
    }

    /// Resets the game to a clean state, running the scenario
    /// Lua's `reset` function, populating initial entities.
    pub fn reset(&mut self) -> MultiMessage {
        use rand::Isaac64Rng;
        use util;
        use scaii_defs::protos::ScaiiPacket;
        use scaii_defs::protos;
        use shred::RunNow;
        use self::resources::COLLISION_MARGIN;

        if !self.initialized {
            self.init();
        }

        *self.world.write_resource::<SkyCollisionWorld>() =
            SkyCollisionWorld::new(COLLISION_MARGIN);
        self.world.write_resource::<Skip>().0 = false;
        self.world.write_resource::<Skip>().1 = None;
        self.last_action = Default::default();

        self.world.delete_all();
        // Do a fast reseed so it doesn't start looping the RNG state
        // after too many episodes
        {
            let rng = &mut *self.world.write_resource::<Isaac64Rng>();
            util::diverge(rng);

            self.world.write_resource::<Episode>().0 += 1;
            self.world.write_resource::<Terminal>().0 = false;
            self.world.write_resource::<Step>().0 = 0;
        }

        self.lua_sys
            .reset(&mut self.world)
            .expect("Could not reset world from Lua");

        // Ensure changes and render
        self.world.maintain();
        self.sim_systems.dispatch_seq(&self.world.res);
        self.lua_sys.run_now(&self.world.res);
        self.out_systems.dispatch_seq(&self.world.res);

        let mut mm = MultiMessage {
            packets: Vec::with_capacity(4),
        };

        if self.render {
            // Build output (VizInit for clearing the screen; Viz for initial display)
            let viz_packet = self.world.read_resource::<Render>().0.clone();

            let scaii_packet = ScaiiPacket {
                src: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Backend(
                        protos::BackendEndpoint {},
                    )),
                },
                dest: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Module(protos::ModuleEndpoint {
                        name: "viz".to_string(),
                    })),
                },
                specific_msg: Some(protos::scaii_packet::SpecificMsg::VizInit(
                    protos::VizInit::default(),
                )),
            };

            mm.packets.push(scaii_packet);

            let scaii_packet = ScaiiPacket {
                src: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Backend(
                        protos::BackendEndpoint {},
                    )),
                },
                dest: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Module(protos::ModuleEndpoint {
                        name: "viz".to_string(),
                    })),
                },
                specific_msg: Some(protos::scaii_packet::SpecificMsg::Viz(viz_packet)),
            };

            mm.packets.push(scaii_packet);
        }

        let scaii_packet = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(protos::endpoint::Endpoint::Backend(
                    protos::BackendEndpoint {},
                )),
            },
            dest: protos::Endpoint {
                endpoint: Some(protos::endpoint::Endpoint::Agent(protos::AgentEndpoint {})),
            },
            specific_msg: Some(protos::scaii_packet::SpecificMsg::State(
                self.world.read_resource::<RtsState>().0.clone(),
            )),
        };

        mm.packets.push(scaii_packet);

        mm
    }

    /// Checks whether the RTS is currently skipping rendering
    /// state messages, and should spin instead or returning.
    pub fn skip(&self) -> bool {
        use self::resources::Skip;
        self.world.read_resource::<Skip>().0
    }

    fn record(&mut self) -> Vec<ScaiiPacket> {
        use scaii_defs::protos;
        use scaii_defs::protos::{RecorderStep, SerializationFormat};
        use scaii_defs::protos::SerializationResponse as SerResp;

        if let Some(_) = self.keyframe_interval {
            let mut out = Vec::with_capacity(2);
            if self.frames_since_keyframe == 0 {
                out.push(ScaiiPacket {
                    src: protos::Endpoint {
                        endpoint: Some(protos::endpoint::Endpoint::Backend(
                            protos::BackendEndpoint {},
                        )),
                    },
                    dest: protos::Endpoint {
                        endpoint: Some(protos::endpoint::Endpoint::Recorder(
                            protos::RecorderEndpoint {},
                        )),
                    },
                    specific_msg: Some(protos::scaii_packet::SpecificMsg::SerResp(SerResp {
                        serialized: self.serialize(),
                        format: SerializationFormat::Nondiverging as i32,
                    })),
                });
            }

            out.push(ScaiiPacket {
                src: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Backend(
                        protos::BackendEndpoint {},
                    )),
                },
                dest: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Recorder(
                        protos::RecorderEndpoint {},
                    )),
                },
                specific_msg: Some(protos::scaii_packet::SpecificMsg::RecorderStep(
                    RecorderStep {
                        action: Some(self.last_action.clone()),
                        ..Default::default()
                    },
                )),
            });

            self.frames_since_keyframe =
                (self.frames_since_keyframe + 1) % self.keyframe_interval.unwrap();
            out
        } else {
            vec![]
        }
    }

    pub fn start_recording(&mut self, keyframe_interval: usize) {
        self.keyframe_interval = Some(keyframe_interval);
        self.frames_since_keyframe = 0;
    }

    /// Performs a single update step of the RTS, if any action
    /// if performed `action_update` should be called first.
    pub fn update(&mut self) -> MultiMessage {
        use scaii_defs::protos;
        use scaii_defs::protos::ScaiiPacket;

        if self.world.read_resource::<Terminal>().0 {
            return Default::default();
        }

        let mut mm = MultiMessage {
            packets: Vec::with_capacity(4),
        };

        // Only record if skipping;
        // Need to do before update because
        // we need to serialize the state this action
        // will bring us to.
        //
        // NOTE: Since skipping isn't processed
        // until the input system runs, this is
        // safe from duplicating the first packet
        // of a newly begun skip
        if self.skip() {
            let mut packets = self.record();
            mm.packets.append(&mut packets);
        }

        self.sim_systems.dispatch_seq(&self.world.res);
        self.lua_sys.run_now(&self.world.res);
        self.out_systems.dispatch_seq(&self.world.res);

        self.world.write_resource::<Step>().0 += 1;

        self.world.maintain();
        self.last_action = Default::default();

        if self.skip() {
            return mm;
        }

        if self.render {
            let render_packet = ScaiiPacket {
                src: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Backend(
                        protos::BackendEndpoint {},
                    )),
                },
                dest: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Module(protos::ModuleEndpoint {
                        name: "viz".to_string(),
                    })),
                },
                specific_msg: Some(protos::scaii_packet::SpecificMsg::Viz(
                    self.world.read_resource::<Render>().0.clone(),
                )),
            };

            mm.packets.push(render_packet);
        }

        if self.world.read_resource::<ReplayMode>().0 {
            return mm;
        }

        let state_packet = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(protos::endpoint::Endpoint::Backend(
                    protos::BackendEndpoint {},
                )),
            },
            dest: protos::Endpoint {
                endpoint: Some(protos::endpoint::Endpoint::Agent(protos::AgentEndpoint {})),
            },
            specific_msg: Some(protos::scaii_packet::SpecificMsg::State(
                self.world.read_resource::<RtsState>().0.clone(),
            )),
        };

        mm.packets.push(state_packet);

        mm
    }

    /// Sets the input to the given `Action` packet.
    pub fn action_input(&mut self, action: Action) {
        self.world.write_resource::<ActionInput>().0 = Some(action.clone());
        self.last_action = action;
    }

    /// Serializes the world into raw bytes
    pub fn serialize(&mut self) -> Vec<u8> {
        use engine::resources::SerializeBytes;

        self.ser_system.run_now(&self.world.res);

        self.world.read_resource::<SerializeBytes>().0.clone()
    }

    /// Deserializes the world from raw bytes, as well as
    /// recalculating anything like collision that cannot be
    /// serialized.
    pub fn deserialize(&mut self, buf: Vec<u8>) -> MultiMessage {
        use scaii_defs::protos;
        self.initialized = false;
        self.world.write_resource::<SerializeBytes>().0 = buf;

        self.de_system.run_now(&self.world.res);
        self.redo_col_sys.run_now(&self.world.res);

        self.world.write_resource::<NeedsKeyInfo>().0 = true;

        self.init();

        let mut packets = Vec::with_capacity(1);
        if self.render {
            let scaii_packet = ScaiiPacket {
                src: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Backend(
                        protos::BackendEndpoint {},
                    )),
                },
                dest: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Module(protos::ModuleEndpoint {
                        name: "viz".to_string(),
                    })),
                },
                specific_msg: Some(protos::scaii_packet::SpecificMsg::VizInit(
                    protos::VizInit::default(),
                )),
            };
            packets.push(scaii_packet);

            self.out_systems.dispatch(&self.world.res);

            let render_packet = ScaiiPacket {
                src: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Backend(
                        protos::BackendEndpoint {},
                    )),
                },
                dest: protos::Endpoint {
                    endpoint: Some(protos::endpoint::Endpoint::Module(protos::ModuleEndpoint {
                        name: "viz".to_string(),
                    })),
                },
                specific_msg: Some(protos::scaii_packet::SpecificMsg::Viz(
                    self.world.read_resource::<Render>().0.clone(),
                )),
            };

            packets.push(render_packet);
        }

        MultiMessage { packets }
    }

    /// Sets whether to emit visualization messages.
    pub fn set_render(&mut self, render: bool) {
        self.render = render;
    }
}

#[cfg(test)]
mod tests {
    use super::{Player, Rts};
    use std::path::PathBuf;

    #[test]
    fn start_rts() {
        let mut rts = Rts::new();
        rts.lua_path = Some(PathBuf::from(format!(
            "{}/lua/example.lua",
            env!("CARGO_MANIFEST_DIR")
        )));

        rts.init();

        assert!(rts.world.read_resource::<Vec<Player>>().len() == 2);

        let _mm = rts.reset();
    }
}
