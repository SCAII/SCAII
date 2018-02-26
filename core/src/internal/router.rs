use scaii_defs::{Agent, Backend, Module, Recorder, Replay};
use scaii_defs::protos::{ModuleEndpoint, MultiMessage, ScaiiPacket};
use scaii_defs::protos::endpoint::Endpoint;

use std::error::Error;
use std::collections::HashMap;
use std::fmt;
use std::fmt::{Display, Formatter};

/// Indicates an attempt to reach a module that has
/// not been registered.
#[derive(Clone, PartialEq, Debug)]
pub struct NoSuchEndpointError {
    end: Endpoint,
}

impl Display for NoSuchEndpointError {
    fn fmt(&self, fmt: &mut Formatter) -> Result<(), fmt::Error> {
        write!(fmt, "No such registered module: {:?}", self.end)
    }
}

impl Error for NoSuchEndpointError {
    fn description(&self) -> &str {
        "Attempt to reach an nonexistant module"
    }
}

/// A simple Router that sends protobuf messages to various modules
#[derive(Default)]
pub struct Router {
    backend: Option<Box<Backend>>,
    agent: Option<Box<Agent>>,
    modules: HashMap<String, Box<Module>>,
    replay: Option<Box<Replay>>,
    recorder: Option<Box<Recorder>>,
}

impl Router {
    /// Initializes an empty Router.
    #[allow(dead_code)]
    pub fn new() -> Self {
        use internal::recorder::RecorderManager;
        Router {
            backend: None,
            agent: None,
            modules: HashMap::new(),
            replay: None,
            recorder: Some(Box::new(RecorderManager::new().expect(
                "Could not determine default replay directory when constructing recorder",
            ))),
        }
    }

    /// Initializes a Router with the specificed Backend instance.
    #[allow(dead_code)]
    pub fn from_backend(backend: Box<Backend>) -> Self {
        use internal::recorder::RecorderManager;
        Router {
            backend: Some(backend),
            agent: None,
            modules: HashMap::new(),
            replay: None,
            recorder: Some(Box::new(RecorderManager::new().expect(
                "Could not determine default replay directory when constructing recorder",
            ))),
        }
    }

    /// /// Initializes a Router with the specificed Agent instance.
    #[allow(dead_code)]
    pub fn from_agent(agent: Box<Agent>) -> Self {
        use internal::recorder::RecorderManager;
        Router {
            backend: None,
            agent: Some(agent),
            modules: HashMap::new(),
            replay: None,
            recorder: Some(Box::new(RecorderManager::new().expect(
                "Could not determine default replay directory when constructing recorder",
            ))),
        }
    }

    /// Decodes a MultiMessage
    /// and routes the resulting packet to the target.
    ///
    /// Any returned values will be any packages routed to the Core,
    /// including Errors the Core needs to forward to the owner module.
    pub fn decode_and_route(&mut self, msg: &MultiMessage) -> Vec<ScaiiPacket> {
        let mut core_msgs: Vec<ScaiiPacket> = Vec::new();
        use scaii_defs::protos::endpoint::Endpoint;
        use scaii_defs::protos::CoreEndpoint;

        for msg in &msg.packets {
            let dest = msg.dest.endpoint.as_ref().expect("Malformed dest field");
            let src = msg.src.endpoint.as_ref().expect("Malformed src field");
            if src == &Endpoint::Core(CoreEndpoint {}) {
                panic!(
                    "FATAL CORE ERROR:\
                     Core should not be using decode_and_route to send its messages."
                )
            }

            if dest == src {
                self.send_error(
                    &format!("Module attempted to send message to itself:\n\t{:?}", msg),
                    src,
                    &Endpoint::Core(CoreEndpoint {}),
                ).unwrap();
                continue;
            }

            match self.route_to(msg) {
                Err(err) => {
                    self.send_error(&format!("{}", err), src, &Endpoint::Core(CoreEndpoint {}))
                        .unwrap();
                }
                Ok(Some(packet)) => core_msgs.push(packet),
                Ok(None) => {}
            }
        }
        core_msgs
    }

    /// Routes the specified ScaiiPacket to the given destination.
    ///
    /// Returns an error if the specified destination does not exist, or if the
    /// target errors on receiving the message.
    pub fn route_to(&mut self, msg: &ScaiiPacket) -> Result<Option<ScaiiPacket>, Box<Error>> {
        let dest = msg.dest.endpoint.as_ref().expect("Malformed dest field");
        println!("received packet {:?}", msg);
        println!("");
        match *dest {
            Endpoint::Backend(_) => {
                let res = self.backend.as_mut().and_then(|v| Some(v.process_msg(msg)));
                if let Some(Err(err)) = res {
                    return Err(err);
                } else if res.is_none() {
                    return Err(Box::new(NoSuchEndpointError { end: dest.clone() }));
                };

                Ok(None)
            }
            Endpoint::Agent(_) => {
                let res = self.agent.as_mut().and_then(|v| Some(v.process_msg(msg)));
                if let Some(Err(err)) = res {
                    return Err(err);
                } else if res.is_none() {
                    return Err(Box::new(NoSuchEndpointError { end: dest.clone() }));
                };

                Ok(None)
            }
            Endpoint::Core(_) => Ok(Some(msg.clone())),
            Endpoint::Module(ModuleEndpoint { ref name }) => {
                let res = self.modules
                    .get_mut(name)
                    .and_then(|v| Some(v.process_msg(msg)));
                if let Some(Err(err)) = res {
                    return Err(err);
                } else if res.is_none() {
                    return Err(Box::new(NoSuchEndpointError { end: dest.clone() }));
                }

                Ok(None)
            }
            Endpoint::Replay(_) => {
                let res = self.replay.as_mut().and_then(|v| Some(v.process_msg(msg)));
                if let Some(Err(err)) = res {
                    return Err(err);
                } else if res.is_none() {
                    return Err(Box::new(NoSuchEndpointError { end: dest.clone() }));
                };

                Ok(None)
            }
            Endpoint::Recorder(_) => {
                let res = self.recorder
                    .as_mut()
                    .and_then(|v| Some(v.process_msg(msg)));
                if let Some(Err(err)) = res {
                    return Err(err);
                } else if res.is_none() {
                    return Err(Box::new(NoSuchEndpointError { end: dest.clone() }));
                };
                println!("....registered recorder");
                Ok(None)
            }
        }
    }

    /// Processes any messages pending from non-owner modules.
    ///
    /// Any returned values will be any packages routed to the Core,
    /// including Errors the Core needs to forward to the owner module.
    pub fn process_module_messages(&mut self) -> Vec<ScaiiPacket> {
        let mut core_messages = Vec::new();
        // Most of the convoluted stuff here is to appease the borrow checker,
        // who thinks we're borrwing ourselves mutably twice if we call
        // `decode_and_route` within the `if let` or `for` blocks
        let msgs = if let Some(ref mut backend) = self.backend {
            backend.get_messages()
        } else {
            MultiMessage {
                packets: Vec::new(),
            }
        };
        core_messages.append(&mut self.decode_and_route(&msgs));

        let msgs = if let Some(ref mut agent) = self.agent {
            agent.get_messages()
        } else {
            MultiMessage {
                packets: Vec::new(),
            }
        };
        core_messages.append(&mut self.decode_and_route(&msgs));

        let mut msgs = Vec::with_capacity(self.modules.len());
        for module in self.modules.values_mut() {
            msgs.push(module.get_messages())
        }

        for msg in msgs {
            core_messages.append(&mut self.decode_and_route(&msg));
        }

        core_messages
    }

    /// Sends an error with the specified message to the given module
    ///
    /// This directly calls `route_to` for you, and panics on an error
    /// because we can't reasonable handle errors if we can't send them
    pub fn send_error(
        &mut self,
        msg: &str,
        dest: &Endpoint,
        src: &Endpoint,
    ) -> Result<Option<ScaiiPacket>, NoSuchEndpointError> {
        use scaii_defs::protos;
        use scaii_defs::protos::scaii_packet::SpecificMsg;

        if !self.endpoint_exists(dest) {
            return Err(NoSuchEndpointError { end: dest.clone() });
        }

        let error_packet = ScaiiPacket {
            dest: protos::Endpoint {
                endpoint: Some(dest.clone()),
            },
            src: protos::Endpoint {
                endpoint: Some(src.clone()),
            },
            specific_msg: Some(SpecificMsg::Err(protos::Error {
                description: msg.to_string(),
                fatal: None,
                error_info: None,
            })),
        };

        let panic_msg = "FATAL CORE ERROR: Cannot send error message from inside core";
        // At this point, we pretty much can't handle errors anymore
        Ok(self.route_to(&error_packet).expect(panic_msg))
    }

    /// Determines if a given RouterEndpoint has been registered with this Router.
    pub fn endpoint_exists(&self, end: &Endpoint) -> bool {
        match *end {
            Endpoint::Core(_) => true,
            Endpoint::Backend(_) => self.backend.is_some(),
            Endpoint::Agent(_) => self.agent.is_some(),
            Endpoint::Replay(_) => self.replay.is_some(),
            Endpoint::Recorder(_) => self.recorder.is_some(),
            Endpoint::Module(ModuleEndpoint { ref name }) => self.modules.get(name).is_some(),
        }
    }

    /// Returns a reference to the registered backend (if any).
    #[allow(dead_code, borrowed_box)]
    pub fn backend(&self) -> Option<&Box<Backend>> {
        self.backend.as_ref()
    }

    /// Returns a mutable reference to the registered backend (if any).
    #[allow(dead_code, borrowed_box)]
    pub fn backend_mut(&mut self) -> Option<&mut Box<Backend>> {
        self.backend.as_mut()
    }

    /// Registers a new backend, returning the old one if one existed.
    #[allow(dead_code)]
    pub fn register_backend(&mut self, backend: Box<Backend>) -> Option<Box<Backend>> {
        use std::mem;
        mem::replace(&mut self.backend, Some(backend))
    }

    /// Registers a new replayer, returning the old one if one existed.
    #[allow(dead_code)]
    pub fn register_replay(&mut self, replay: Box<Replay>) -> Option<Box<Replay>> {
        use std::mem;
        mem::replace(&mut self.replay, Some(replay))
    }

    #[allow(dead_code, borrowed_box)]
    pub fn replay(&self) -> Option<&Box<Replay>> {
        self.replay.as_ref()
    }

    /// Registers a new recorder, returning the old one if one existed.
    #[allow(dead_code)]
    pub fn register_recorder(&mut self, recorder: Box<Recorder>) -> Option<Box<Recorder>> {
        use std::mem;
        mem::replace(&mut self.recorder, Some(recorder))
    }

    #[allow(dead_code, borrowed_box)]
    pub fn recorder(&self) -> Option<&Box<Recorder>> {
        self.recorder.as_ref()
    }

    /// Returns a reference to the registered agent (if any).
    #[allow(dead_code, borrowed_box)]
    pub fn agent(&self) -> Option<&Box<Agent>> {
        self.agent.as_ref()
    }

    /// Returns a mutable reference to the registered agent (if any).
    #[allow(dead_code, borrowed_box)]
    pub fn agent_mut(&mut self) -> Option<&mut Box<Agent>> {
        self.agent.as_mut()
    }

    /// Registers a new agent, returning the old one if one existed.
    #[allow(dead_code)]
    pub fn register_agent(&mut self, agent: Box<Agent>) -> Option<Box<Agent>> {
        use std::mem;
        mem::replace(&mut self.agent, Some(agent))
    }

    /// Returns a reference to the specified module (if it exists).
    #[allow(dead_code, borrowed_box)]
    pub fn module(&self, name: &str) -> Option<&Box<Module>> {
        self.modules.get(name)
    }

    /// Returns a mutable reference to the specified module (if it exists).
    #[allow(dead_code, borrowed_box)]
    pub fn module_mut(&mut self, name: &str) -> Option<&mut Box<Module>> {
        self.modules.get_mut(name)
    }

    /// Registers the module under the given name. If a module already exists
    /// under this name, it will be returned.
    #[allow(dead_code)]
    pub fn register_module(&mut self, name: String, module: Box<Module>) -> Option<Box<Module>> {
        self.modules.insert(name.clone(), module)
    }
}
