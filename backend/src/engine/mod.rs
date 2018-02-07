pub mod components;
pub mod systems;
pub mod resources;

use self::resources::*;

use scaii_defs::protos::{Action, MultiMessage};

use specs::{Dispatcher, World};

use self::components::FactionId;
use self::systems::lua::LuaSystem;

use std::path::PathBuf;

pub struct Rts<'a, 'b> {
    world: World,
    pub lua_path: Option<PathBuf>,
    pub initialized: bool,
    pub render: bool,

    sim_systems: Dispatcher<'a, 'b>,
    lua_sys: LuaSystem,
    out_systems: Dispatcher<'a, 'b>,
}

impl<'a, 'b> Rts<'a, 'b> {
    pub fn new() -> Self {
        use specs::DispatcherBuilder;
        use self::systems::{AttackSystem, CleanupSystem, CollisionSystem, InputSystem, MoveSystem,
                            RenderSystem, StateBuildSystem};

        let mut world = World::new();
        components::register_world_components(&mut world);
        resources::register_world_resources(&mut world);

        let simulation_builder: Dispatcher = DispatcherBuilder::new()
            .add(InputSystem::new(), "input", &[])
            .add(MoveSystem::new(), "movement", &["input"])
            .add(CollisionSystem, "collision", &["movement"])
            .add(AttackSystem, "attack", &["collision"])
            .build();

        let output_builder = DispatcherBuilder::new()
            .add(RenderSystem {}, "render", &[])
            .add(CleanupSystem, "cleanup", &["render"])
            .add(StateBuildSystem::new(), "state", &["cleanup"])
            .build();

        let lua_sys = LuaSystem::new();

        Rts {
            world,
            lua_sys,
            lua_path: None,
            initialized: false,
            render: false,
            sim_systems: simulation_builder,
            out_systems: output_builder,
        }
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

    fn init(&mut self) {
        self.lua_sys
            .init(
                &mut self.world,
                self.lua_path.as_ref().expect("No Lua file loaded"),
            )
            .expect("Could not load Lua file");

        self.lua_sys
            .load_scenario(&mut self.world)
            .expect("Could not initialize scenario");
    }

    pub fn reset(&mut self) -> MultiMessage {
        use rand::Isaac64Rng;
        use util;
        use scaii_defs::protos::ScaiiPacket;
        use scaii_defs::protos;
        use shred::RunNow;
        use self::resources::COLLISION_MARGIN;

        if !self.initialized {
            self.init();
            self.initialized = true;
        }

        *self.world.write_resource::<SkyCollisionWorld>() =
            SkyCollisionWorld::new(COLLISION_MARGIN);

        self.world.delete_all();
        // Do a fast reseed so it doesn't start looping the RNG state
        // after too many episodes
        {
            let rng = &mut *self.world.write_resource::<Isaac64Rng>();
            util::diverge(rng);

            self.world.write_resource::<Episode>().0 += 1;
            self.world.write_resource::<Terminal>().0 = false;
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
            packets: Vec::with_capacity(2),
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

    pub fn skip(&self) -> bool {
        use self::resources::Skip;
        self.world.read_resource::<Skip>().0
    }

    pub fn update(&mut self) -> MultiMessage {
        use scaii_defs::protos;
        use scaii_defs::protos::ScaiiPacket;
        use specs::RunNow;

        if self.world.read_resource::<Terminal>().0 {
            return Default::default();
        }

        self.sim_systems.dispatch_seq(&self.world.res);
        self.lua_sys.run_now(&self.world.res);
        self.out_systems.dispatch_seq(&self.world.res);

        self.world.maintain();

        let mut packets = vec![];
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

            packets.push(render_packet);
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

        packets.push(state_packet);

        MultiMessage { packets: packets }
    }

    pub fn action_input(&mut self, action: Action) {
        self.world.write_resource::<ActionInput>().0 = Some(action);
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
