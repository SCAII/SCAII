use scaii_defs::{Backend, Agent, Module};
use scaii_defs::protos::{MultiMessage, ScaiiPacket, RouterEndpoint};

use std::error::Error;
use std::collections::HashMap;
use std::fmt;
use std::fmt::{Display, Formatter};

/// Indicates an attempt to reach a module that has
/// not been registered.
#[derive(Clone, Eq, PartialEq, Debug)]
pub struct NoSuchEndpointError {
    end: RouterEndpoint,
}

impl Display for NoSuchEndpointError {
    fn fmt(&self, fmt: &mut Formatter) -> Result<(), fmt::Error> {
        write!(fmt, "No such registered module: {}", self.end)
    }
}

impl Error for NoSuchEndpointError {
    fn description(&self) -> &str {
        "Attempt to reach an nonexistant module"
    }
}

/// A simple Router that sends protobuf messages to various modules
pub struct Router {
    backend: Option<Box<Backend>>,
    agent: Option<Box<Agent>>,
    modules: HashMap<String, Box<Module>>,
}

impl Router {
    /// Initializes an empty Router.
    #[allow(dead_code)]
    pub fn new() -> Self {
        Router {
            backend: None,
            agent: None,
            modules: HashMap::new(),
        }
    }

    /// Initializes a Router with the specificed Backend instance.
    #[allow(dead_code)]
    pub fn from_backend(backend: Box<Backend>) -> Self {
        Router {
            backend: Some(backend),
            agent: None,
            modules: HashMap::new(),
        }
    }

    /// /// Initializes a Router with the specificed Agent instance.
    #[allow(dead_code)]
    pub fn from_agent(agent: Box<Agent>) -> Self {
        Router {
            backend: None,
            agent: Some(agent),
            modules: HashMap::new(),
        }
    }

    /// Decodes a MultiMessage
    /// and routes the resulting packet to the target.
    ///
    /// Any returned values will be any packages routed to the Core,
    /// including Errors the Core needs to forward to the owner module.
    pub fn decode_and_route(&mut self, msg: &MultiMessage) -> Vec<ScaiiPacket> {
        let mut core_msgs: Vec<ScaiiPacket> = Vec::new();

        for msg in msg.get_packets().iter() {
            let dest = RouterEndpoint::from_scaii_packet_dest(msg);
            let src = RouterEndpoint::from_scaii_packet_src(msg);
            if !src.is_ok() {
                core_msgs.push(
                    self.send_error(
                        "Module contains malformed src field",
                        &RouterEndpoint::Core,
                        &RouterEndpoint::Core,
                    ).unwrap()
                        .unwrap(),
                );
                continue;
            }
            let src = src.unwrap();
            if src == RouterEndpoint::Core {
                panic!(
                    "FATAL CORE ERROR: Core should not be using decode_and_route to send its messages."
                )
            }

            if let Err(err) = dest.clone() {
                self.send_error(&format!("{}", err), &src, &RouterEndpoint::Core)
                    .unwrap()
                    .unwrap();
            }
            let dest = dest.unwrap();

            if dest == src {
                self.send_error(
                    "Module attempted to send message to itself",
                    &src,
                    &RouterEndpoint::Core,
                ).unwrap();
                continue;

            }

            match self.route_to(&msg) {
                Err(err) => {

                    self.send_error(&format!("{}", err), &src, &RouterEndpoint::Core)
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
        let dest = &RouterEndpoint::from_scaii_packet_dest(msg)?;
        match *dest {
            RouterEndpoint::Backend => {
                let res = self.backend.as_mut().and_then(|v| Some(v.process_msg(msg)));
                if let Some(Err(err)) = res {
                    return Err(err);
                } else if res.is_none() {
                    return Err(Box::new(NoSuchEndpointError { end: dest.clone() }));
                };

                Ok(None)
            }
            RouterEndpoint::Agent => {
                let res = self.agent.as_mut().and_then(|v| Some(v.process_msg(msg)));
                if let Some(Err(err)) = res {
                    return Err(err);
                } else if res.is_none() {
                    return Err(Box::new(NoSuchEndpointError { end: dest.clone() }));
                };

                Ok(None)
            }
            RouterEndpoint::Core => Ok(Some(msg.clone())),
            RouterEndpoint::Module { ref name } => {
                let res = self.modules.get_mut(name).and_then(
                    |v| Some(v.process_msg(msg)),
                );
                if let Some(Err(err)) = res {
                    return Err(err);
                } else if res.is_none() {
                    return Err(Box::new(NoSuchEndpointError { end: dest.clone() }));
                }

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
            MultiMessage::new()
        };
        core_messages.append(&mut self.decode_and_route(&msgs));

        let msgs = if let Some(ref mut agent) = self.agent {
            agent.get_messages()
        } else {
            MultiMessage::new()
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
        dest: &RouterEndpoint,
        src: &RouterEndpoint,
    ) -> Result<Option<ScaiiPacket>, NoSuchEndpointError> {
        use scaii_defs::protos;

        if !self.endpoint_exists(dest) {
            return Err(NoSuchEndpointError { end: dest.clone() });
        }

        let (dest, mod_name) = dest.to_packet_dest();
        let (src, src_mod_name) = src.to_packet_dest();

        let mut error_packet = ScaiiPacket::new();
        error_packet.set_dest(dest);
        if let Some(mod_name) = mod_name {
            error_packet.set_module_name(mod_name.to_string());
        }
        error_packet.set_source(src);
        if let Some(src_mod_name) = src_mod_name {
            error_packet.set_source_name(src_mod_name.to_string());
        }
        let mut err = protos::Error::new();
        err.set_description(msg.to_string());
        error_packet.set_err(err);

        let panic_msg = "FATAL CORE ERROR: Cannot send error message from inside core";
        // At this point, we pretty much can't handle errors anymore
        Ok(Some(self.route_to(&error_packet).expect(panic_msg).expect(
            panic_msg,
        )))
    }

    /// Determines if a given RouterEndpoint has been registered with this Router.
    pub fn endpoint_exists(&self, end: &RouterEndpoint) -> bool {
        match *end {
            RouterEndpoint::Core => true,
            RouterEndpoint::Backend => self.backend.is_some(),
            RouterEndpoint::Agent => self.agent.is_some(),
            RouterEndpoint::Module { ref name } => self.modules.get(name).is_some(),
        }
    }

    /// Returns a reference to the registered backend (if any).
    #[allow(dead_code)]
    pub fn backend(&self) -> Option<&Box<Backend>> {
        self.backend.as_ref()
    }

    /// Returns a mutable reference to the registered backend (if any).
    #[allow(dead_code)]
    pub fn backend_mut(&mut self) -> Option<&mut Box<Backend>> {
        self.backend.as_mut()
    }

    /// Registers a new backend, returning the old one if one existed.
    #[allow(dead_code)]
    pub fn register_backend(&mut self, backend: Box<Backend>) -> Option<Box<Backend>> {
        use std::mem;
        mem::replace(&mut self.backend, Some(backend))
    }

    /// Returns a reference to the registered agent (if any).
    #[allow(dead_code)]
    pub fn agent(&self) -> Option<&Box<Agent>> {
        self.agent.as_ref()
    }

    /// Returns a mutable reference to the registered agent (if any).
    #[allow(dead_code)]
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
    #[allow(dead_code)]
    pub fn module(&self, name: &str) -> Option<&Box<Module>> {
        self.modules.get(name)
    }

    /// Returns a mutable reference to the specified module (if it exists).
    #[allow(dead_code)]
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
