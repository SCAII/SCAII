#[macro_use]
extern crate prost_derive;
#[macro_use]
extern crate serde_derive;

use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fmt;
use std::rc::Rc;
use std::cell::RefCell;

/// Contains protobuf definitions
pub mod protos;

use protos::{MultiMessage, ScaiiPacket};

/// The serialization style supported by an environment.
/// Currently, Nondiverging is for the benefit of a frontend only (i.e.
/// optimizing MCTS for deterministic environments),` NondivergingOnly`,
/// and Full are treated the same way by the SCAII internals (and
/// backends, by spec).
#[derive(Serialize, Deserialize, Clone, Copy, Eq, PartialEq, Debug)]
pub enum SerializationStyle {
    None,
    DivergingOnly,
    NondivergingOnly,
    Full,
}

/// The supported behavior of a given backend environment,
/// currently the only relevant one is serialization support.
#[derive(Serialize, Deserialize, Clone, Eq, PartialEq, Debug)]
pub struct BackendSupported {
    pub serialization: SerializationStyle,
}

impl BackendSupported {
    pub fn from_prost(proto: protos::BackendSupported) -> Self {
        BackendSupported {
            serialization: match proto.serialization_support {
                0 => SerializationStyle::None,
                1 => SerializationStyle::DivergingOnly,
                2 => SerializationStyle::NondivergingOnly,
                3 => SerializationStyle::Full,
                _ => unreachable!("Enum covers only variants"),
            },
        }
    }
}

/// Indicates that the optional functionality requested is not
/// present on this backend.
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub struct UnsupportedError;

impl Display for UnsupportedError {
    fn fmt(&self, f: &mut Formatter) -> Result<(), fmt::Error> {
        f.write_str(self.description())
    }
}

impl Error for UnsupportedError {
    fn description(&self) -> &str {
        "Unsupported by backend"
    }
}

/// The Module trait describes any Module that may send and receive messages
///
/// In addition, plugin objects that provide a **non-backend** Module must define a
/// crate root-level `#[no_mangle]` function like so:
///
/// ```text
/// // Returns a boxed backend, configuration is done through
/// // initialization protobuf messages
/// fn new() -> Box<Module>;
/// ```
///
/// Note that the trait object will properly call `drop` if implemented.
pub trait Module {
    /// Processes a message and returns an error if the message is ill-formatted
    /// or unexpected.
    ///
    /// The receiver may assume that `msg.dest` corresponds to this module.
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>>;

    /// Gets all waiting messages from the module, and clears the module's
    /// outgoing message queue.
    fn get_messages(&mut self) -> MultiMessage;
}

/// The Backend trait provides specialized methods for Backend modules
///
/// Optional behaviors are given a default implementation, but this should
/// be matched by a corresponding `SupportedBehavior` that indicates
/// the functions are not present.
///
/// In addition, plugin objects meeting the backend definition must define two
/// public crate-root level `#[no_mangle]` functions like so:
///
/// ```text
/// // Returns a boxed backend, configuration is done through
/// // initialization protobuf messages
/// fn new_backend() -> Box<Backend>;
///
/// // Yields the supported behavior of a trait object returned by this backend
/// fn supported_behavior() -> BackendSupported;
/// ```
///
/// Note that the trait object will properly call `drop` if implemented.
///
/// Any backend plugin must additionally implement the crate-level `new` function
/// that returns the backend as a `Box<Module>`.
pub trait Backend: Module {
    /// Convenience alias for the crate-level supported behavior function.
    /// This takes `&self` for convenience of the core plugin wrapper.
    fn supported_behavior(&self) -> BackendSupported;

    /// Non-divergently Serializes the state in the target buffer, or returns an error on improper
    /// serialization. Default implementation is that serialization is unsupported.
    #[allow(unused_variables)]
    fn serialize(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        Err(Box::new(UnsupportedError))
    }

    /// Non-divergently deserializes the state in the target buffer,
    /// or returns an error on an incorrect
    /// buffer. Default implementation is that serialization is unsupported.
    #[allow(unused_variables)]
    fn deserialize(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        Err(Box::new(UnsupportedError))
    }

    /// Divergently Serializes the state in the target buffer, or returns an error on improper
    /// serialization. Default implementation is that serialization is unsupported.
    #[allow(unused_variables)]
    fn serialize_diverging(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        Err(Box::new(UnsupportedError))
    }

    /// Divergently deserializes the state in the target buffer, or returns an error on an incorrect
    /// buffer. Default implementation is that serialization is unsupported.
    #[allow(unused_variables)]
    fn deserialize_diverging(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        Err(Box::new(UnsupportedError))
    }
}

/// An Agent (aka RL environment or model) attached to this
/// environment.
///
/// Another type of module (e.g. GUI-driven visualization) may want special
/// methods to drive a subscriber frontend eventually, but at the moment
/// this is just a marker trait.
pub trait Agent: Module {}

/// The Replay mechanism attached to this environment
pub trait Replay: Module {}

impl<T: Module> Module for Rc<RefCell<T>> {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        (*self.borrow_mut()).process_msg(msg)
    }

    fn get_messages(&mut self) -> MultiMessage {
        self.borrow_mut().get_messages()
    }
}

impl<T: Replay> Replay for Rc<RefCell<T>> {}

impl<T: Backend> Backend for Rc<RefCell<T>> {
    fn supported_behavior(&self) -> BackendSupported {
        (*self.borrow()).supported_behavior()
    }

    fn serialize(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        (*self.borrow_mut()).serialize(into)
    }

    fn deserialize(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        (*self.borrow_mut()).deserialize(buf)
    }

    fn serialize_diverging(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        (*self.borrow_mut()).serialize_diverging(into)
    }

    fn deserialize_diverging(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        (*self.borrow_mut()).deserialize_diverging(buf)
    }
}

impl<T: Agent> Agent for Rc<RefCell<T>> {}
