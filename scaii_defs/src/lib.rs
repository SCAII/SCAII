#[macro_use]
extern crate prost_derive;
#[macro_use]
extern crate serde_derive;

use std::cell::RefCell;
use std::error::Error;
use std::rc::Rc;

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

    pub fn to_proto(&self) -> protos::BackendSupported {
        use protos::backend_supported::SerializationSupport as Support;
        use SerializationStyle as Ser;
        protos::BackendSupported {
            serialization_support: match self.serialization {
                Ser::None => Support::None,
                Ser::DivergingOnly => Support::DivergingOnly,
                Ser::NondivergingOnly => Support::NondivergingOnly,
                Ser::Full => Support::Full,
            } as i32,
        }
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

/// A marker trait indicating this is a backend
pub trait Backend: Module {}

/// An Agent (aka RL environment or model) attached to this
/// environment.
///
/// Another type of module (e.g. GUI-driven visualization) may want special
/// methods to drive a subscriber frontend eventually, but at the moment
/// this is just a marker trait.
pub trait Agent: Module {}

/// The Replay mechanism attached to this environment
pub trait Replay: Module {}

/// The Recorder mechanism attached to this environment
pub trait Recorder: Module {}

impl<T: Module> Module for Rc<RefCell<T>> {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        (*self.borrow_mut()).process_msg(msg)
    }

    fn get_messages(&mut self) -> MultiMessage {
        self.borrow_mut().get_messages()
    }
}

impl<T: Replay> Replay for Rc<RefCell<T>> {}

impl<T: Recorder> Recorder for Rc<RefCell<T>> {}

impl<T: Backend> Backend for Rc<RefCell<T>> {}

impl<T: Agent> Agent for Rc<RefCell<T>> {}
