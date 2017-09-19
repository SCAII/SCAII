use scaii_defs::{Backend, Module, Msg};
use scaii_defs::protos::ScaiiPacket;
use protobuf;

use std::error::Error;
use std::collections::HashMap;
use std::fmt;
use std::fmt::{Display, Formatter, Debug};

/// Indicates an attempt to reach a module that has
/// not been registered.
#[derive(Clone, Eq, PartialEq, Hash, Debug)]
pub struct NoSuchEndpointError {
    name: String,
}

impl Display for NoSuchEndpointError {
    fn fmt(&self, fmt: &mut Formatter) -> Result<(), fmt::Error> {
        write!(fmt, "No such registered module: {}", self.name)
    }
}

impl Error for NoSuchEndpointError {
    fn description(&self) -> &str {
        "Attempt to reach an nonexistant module"
    }
}

/// Indicates an attempt to register a module with a reserved module name.
///
/// Contains the module the user attempted to register.
pub struct ReservedNameError {
    name: String,
    pub module: Box<Module>,
}

impl Debug for ReservedNameError {
    fn fmt(&self, fmt: &mut Formatter) -> Result<(), fmt::Error> {
        write!(fmt, "{{ ReservedNameError: {{ name: {} }} }}", self.name)
    }
}

impl Display for ReservedNameError {
    fn fmt(&self, fmt: &mut Formatter) -> Result<(), fmt::Error> {
        write!(
            fmt,
            "Module name is reserved: {} (if you tried to register a backend, use register_backend())",
            self.name
        )
    }
}

impl Error for ReservedNameError {
    fn description(&self) -> &str {
        "Attempt to register module with a reserved name"
    }
}

/// The destination or source of a routed message
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum RouterEndpoint<'a> {
    Backend,
    Module { name: &'a str },
}

impl<'a> RouterEndpoint<'a> {
    pub fn from_string(name: &'a str) -> RouterEndpoint<'a> {
        match name {
            "backend" => RouterEndpoint::Backend,
            _ => RouterEndpoint::Module { name: name },
        }
    }
}

impl<'a> Display for RouterEndpoint<'a> {
    fn fmt(&self, fmt: &mut Formatter) -> Result<(), fmt::Error> {
        write!(
            fmt,
            "{}",
            match *self {
                RouterEndpoint::Backend => "backend",
                RouterEndpoint::Module { ref name } => name,
            }
        )
    }
}

/// A simple Router that sends protobuf messages to various modules
pub struct Router {
    backend: Option<Box<Backend>>,
    modules: HashMap<String, Box<Module>>,
}

impl Router {
    /// Initializes an empty Router.
    pub fn new() -> Self {
        Router {
            backend: None,
            modules: HashMap::new(),
        }
    }

    /// Initializes a Router with the specificed Backend instance.
    pub fn from_backend(backend: Box<Backend>) -> Self {
        Router {
            backend: Some(backend),
            modules: HashMap::new(),
        }
    }

    /// Decodes a Msg that is known to be of type ScaiiPacket
    /// and routes the resulting packet to the target.
    ///
    /// Returns an error if the message is not of type `ScaiiPacket`,
    /// the module specified in the message does not exist,
    /// or the target errors on receiving the message.
    pub fn decode_and_route(&mut self, msg: &Msg) -> Result<(), Box<Error>> {
        let ScaiiPacket {
            msg: msg,
            module: dest,
            ..
        } = protobuf::parse_from_bytes(&msg.msg[..])?;
        let msg = Msg { msg: msg };
        let dest = RouterEndpoint::from_string(&dest);

        self.route_to(&msg, &dest)
    }

    /// Routes the specified message to the given destination.
    ///
    /// This message should be a message the target understands, not
    /// a ScaiiPacket or similar.
    ///
    /// Returns an error if the specified destination does not exist, or if the
    /// target errors on receiving the message.
    pub fn route_to(&mut self, msg: &Msg, dest: &RouterEndpoint) -> Result<(), Box<Error>> {
        match *dest {
            RouterEndpoint::Backend => {
                self.backend
                    .as_mut()
                    .and_then(|v| Some(v.process_msg(msg)))
                    .unwrap_or(Err(Box::new(
                        NoSuchEndpointError { name: "backend".to_string() },
                    )))
            }
            RouterEndpoint::Module { ref name } => {
                self.modules
                    .get_mut(*name)
                    .and_then(|mut v| Some(v.process_msg(msg)))
                    .unwrap_or(Err(
                        Box::new(NoSuchEndpointError { name: name.to_string() }),
                    ))
            }
        }
    }

    /// Returns a reference to the registered backend (if any).
    pub fn backend(&self) -> Option<&Box<Backend>> {
        self.backend.as_ref()
    }

    /// Returns a mutable reference to the registered backend (if any).
    pub fn backend_mut(&mut self) -> Option<&mut Box<Backend>> {
        self.backend.as_mut()
    }

    /// Returns a reference to the specified module (if it exists).
    ///
    /// Note, no parsing of the name is done; if you want the backend
    /// please use "backend".
    pub fn module(&self, name: &str) -> Option<&Box<Module>> {
        self.modules.get(name)
    }

    /// Returns a mutable reference to the specified module (if it exists).
    ///
    /// Note, no parsing of the name is done; if you want the backend
    /// please use "backend_mut".
    pub fn module_mut(&mut self, name: &str) -> Option<&mut Box<Module>> {
        self.modules.get_mut(name)
    }

    /// Registers the module under the given name. If a module already exists
    /// under this name, it will be returned.
    ///
    /// If you attempt to register a reserved name (specifically: "backend"),
    /// this will return and error which contains the module you attempted to
    /// regiser.
    pub fn register_module(
        &mut self,
        name: String,
        module: Box<Module>,
    ) -> Result<Option<Box<Module>>, ReservedNameError> {
        use std::collections::hash_map::Entry::*;

        if name == "backend" {
            Err(ReservedNameError {
                module: module,
                name: name,
            })
        } else {
            Ok(self.modules.insert(name.clone(), module))
        }
    }
}
