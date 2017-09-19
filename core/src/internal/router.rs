use scaii_defs::{Backend, Module, Msg};
use scaii_defs::protos::ScaiiPacket;
use protobuf;

use std::error::Error;
use std::collections::HashMap;
use std::fmt;
use std::fmt::{Display, Formatter};

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
        "No such module"
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

    pub fn backend(&self) -> Option<&Box<Backend>> {
        self.backend.as_ref()
    }

    pub fn backend_mut(&mut self) -> Option<&mut Box<Backend>> {
        self.backend.as_mut()
    }

    pub fn module(&self, name: &str) -> Option<&Box<Module>> {
        self.modules.get(name)
    }

    pub fn module_mut(&mut self, name: &str) -> Option<&mut Box<Module>> {
        self.modules.get_mut(name)
    }
}
