// For clippy
#![allow(unknown_lints)]

extern crate bincode;
#[macro_use]
extern crate lazy_static;
extern crate libc;
extern crate libloading;
extern crate prost;
extern crate scaii_defs;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate websocket;
use scaii_defs::protos::{AgentEndpoint, MultiMessage, ScaiiPacket};
use std::error::Error;
use internal::router::Router;
use internal::agent::PublisherAgent;
use std::rc::Rc;
use std::cell::RefCell;

#[cfg(feature = "c_api")]
mod c_api;
#[cfg(feature = "c_api")]
pub use c_api::*;

pub mod util;
pub use util::*;
pub mod scaii_config;
pub use scaii_config::*;

// Don't publicly expose our internal structure to FFI
pub(crate) mod internal;
//...but expose ReplayAction so Replay can access it in Recorder (Replay is a binary so different crate)
pub use internal::recorder::{get_default_replay_file_path, ActionWrapper, ReplayAction,
                             ReplayHeader, SerializationInfo, SerializedProtosAction,
                             SerializedProtosEndpoint, SerializedProtosScaiiPacket,
                             SerializedProtosSerializationResponse};
pub use internal::rpc::get_rpc_config_for_viz;

/// The Environment created by this library.
#[derive(Default)]
pub struct Environment {
    router: Router,
}

const FATAL_OWNER_ERROR: &'static str = "FATAL CORE ERROR: Cannot forward message to owner";

impl Environment {
    pub fn new() -> Self {
        Environment {
            router: Router::new(),
        }
    }

    pub fn agent_owned() -> (Self, Rc<RefCell<PublisherAgent>>) {
        let agent = Rc::new(RefCell::new(PublisherAgent::new()));
        let me = Environment {
            router: Router::from_agent(Box::new(Rc::clone(&agent))),
        };

        (me, agent)
    }

    pub fn router(&self) -> &Router {
        &self.router
    }

    pub fn router_mut(&mut self) -> &mut Router {
        &mut self.router
    }

    pub fn update(&mut self) {
        let core_msgs = self.router.process_module_messages();
        self.process_core_messages(core_msgs);
    }

    pub fn route_messages(&mut self, msg: &MultiMessage) {
        let core_msgs = self.router.decode_and_route(msg);
        self.process_core_messages(core_msgs);
    }

    /// Processes all messages returned by module message processing routed to
    /// "core"
    fn process_core_messages(&mut self, packets: Vec<ScaiiPacket>) {
        use scaii_defs::protos::scaii_packet::SpecificMsg;
        use scaii_defs::protos::{Cfg, CoreCfg, PluginType};
        use scaii_defs::protos::cfg::WhichModule;
        for packet in packets {
            if packet.specific_msg.is_none() {
                self.handle_errors_possible_failure(
                    &packet,
                    "Specific Message field has invalid variant",
                );
            }

            match packet.specific_msg.clone().unwrap() {
                SpecificMsg::Err(_) => self.forward_err_to_owner(&mut packet.clone()),
                SpecificMsg::Config(Cfg {
                    which_module:
                        Some(WhichModule::CoreCfg(CoreCfg {
                            plugin_type:
                                PluginType {
                                    plugin_type: Some(ref mut plugin_type),
                                },
                        })),
                }) => {
                    let res = self.load_cfg(plugin_type);
                    if let Err(err) = res {
                        self.handle_errors_possible_failure(
                            &packet,
                            &format!("Could not complete configuration: {}", err),
                        );
                    }
                }
                SpecificMsg::Config(Cfg {
                    which_module: Some(_),
                }) => self.handle_errors_possible_failure(
                    &packet,
                    "Core only handles correctly formed CoreCfg config messages.",
                ),
                _ => {
                    self.handle_errors_possible_failure(&packet, "Message type not suited for Core")
                }
            }
        }
    }

    fn load_cfg(
        &mut self,
        plugin_type: &mut scaii_defs::protos::plugin_type::PluginType,
    ) -> Result<(), Box<Error>> {
        use scaii_defs::protos::plugin_type::PluginType::*;
        use internal::{rpc, rust_ffi};
        use internal::LoadedAs;

        match *plugin_type {
            RustPlugin(ref cfg) => match rust_ffi::init_ffi(cfg.clone())? {
                LoadedAs::Backend(backend) => {
                    let prev = self.router.register_backend(backend);
                    if prev.is_some() {
                        Err("Backend previously registered, overwriting".to_string())?
                    } else {
                        Ok(())
                    }
                }
                LoadedAs::Module(module, name) => {
                    let prev = self.router.register_module(name.clone(), module);
                    if prev.is_some() {
                        Err(format!(
                            "Module {} previously registered, overwriting",
                            name
                        ))?
                    } else {
                        Ok(())
                    }
                }
            },
            Rpc(ref cfg) => match rpc::init_rpc(cfg)? {
                LoadedAs::Backend(_) => unimplemented!(),
                LoadedAs::Module(module, name) => {
                    let prev = self.router.register_module(name.clone(), module);
                    if prev.is_some() {
                        Err(format!(
                            "Module {} previously registered, overwriting",
                            name
                        ))?
                    } else {
                        Ok(())
                    }
                }
            },
        }
    }

    /// Handles error forwarding. First it tries the module the packet originated from,
    /// and if it can't get a hold of that it tries the owner.
    /// Otherwise, it panics because something very bad has happened.
    fn handle_errors_possible_failure(&mut self, packet: &ScaiiPacket, descrip: &str) {
        use scaii_defs::protos::endpoint::Endpoint;
        use scaii_defs::protos::CoreEndpoint;

        let error_src = packet.src.endpoint.as_ref().unwrap();
        let res = self.router
            .send_error(descrip, error_src, &Endpoint::Core(CoreEndpoint {}));

        if let Err(err) = res {
            self.router
                .send_error(
                    &format!(
                        "{};\n\
                         The module who made this mistake no longer exists: {}",
                        descrip, err
                    ),
                    error_src,
                    &Endpoint::Core(CoreEndpoint {}),
                )
                .expect(&format!(
                    "{}:\n\t(Original Error): {}",
                    FATAL_OWNER_ERROR, err
                ));
            return;
        }
    }

    /// Forwards an error to the owner of this environment,
    /// panicking on failure because something has gone very wrong.
    fn forward_err_to_owner(&mut self, packet: &mut ScaiiPacket) {
        use scaii_defs::protos::endpoint;
        use scaii_defs::protos;

        let dest = protos::Endpoint {
            endpoint: Some(endpoint::Endpoint::Agent(AgentEndpoint {})),
        };
        packet.dest = dest;
        self.router.route_to(packet).expect(FATAL_OWNER_ERROR);
    }
}
