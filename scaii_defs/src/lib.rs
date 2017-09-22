extern crate protobuf;
#[macro_use]
extern crate serde_derive;

use std::path::PathBuf;
use std::error::Error;
use std::fmt::{Formatter, Display};
use std::fmt;

/// Contains protobuf definitions
pub mod protos;
pub mod errors;

use protos::{MultiMessage, ScaiiPacket, CoreCfg};

/// Arguments for initializating a dynamically loaded Rust
/// plugin.
#[derive(Serialize, Deserialize, Clone, Eq, PartialEq, Debug)]
pub struct RustFFIArgs {
    pub plugin_path: PathBuf,
}

/// The list of supported backend languages
#[derive(Serialize, Deserialize, Clone, Eq, PartialEq, Debug)]
pub enum PluginType {
    RustFFI { args: RustFFIArgs, init_as: InitAs },
}

impl PluginType {
    fn from_plugin_type_proto(plugin_type: &protos::PluginType) -> Self {
        if plugin_type.has_rust_plugin() {
            PluginType::RustFFI {
                args: RustFFIArgs {
                    plugin_path: PathBuf::from(
                        plugin_type.get_rust_plugin().get_plugin_path().to_string(),
                    ),
                },
                init_as: InitAs::from_init_as_proto(plugin_type.get_rust_plugin().get_init_as()),
            }
        } else {
            unreachable!("There are no other plugin types supported");
        }
    }
}

/// Specifies which type of plugin to load the given environment as.
#[derive(Serialize, Deserialize, Clone, Eq, PartialEq, Hash, Debug)]
pub enum InitAs {
    Backend,
    Module { name: String },
}

impl InitAs {
    pub fn from_init_as_proto(init_as: &protos::InitAs) -> Self {
        if init_as.has_backend() {
            InitAs::Backend
        } else {
            let name = init_as.get_module().get_name().to_string();
            InitAs::Module { name: name }
        }
    }
}

/// The parameters for creating a backend environment
#[derive(Serialize, Deserialize, Clone, Eq, PartialEq, Debug)]
pub struct EnvironmentInitArgs {
    pub module_type: PluginType,
}

impl EnvironmentInitArgs {
    /// Creates environment initialization parameters
    /// from a rust-friendly translation of CoreCfg
    pub fn from_core_cfg(cfg: &CoreCfg) -> Self {
        EnvironmentInitArgs {
            module_type: PluginType::from_plugin_type_proto(cfg.get_plugin_type()),
        }
    }
}

/// The serialization style supported by an environment.
/// Currently, Nondiverging is for the benefit of a frontend only (i.e.
/// optimizing MCTS for deterministic environments), NondivergingOnly,
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
pub struct SupportedBehavior {
    pub serialization: SerializationStyle,
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
/// ```
/// // Returns a boxed backend, configuration is done through
/// // initialization protobuf messages
/// fn new() -> Box<Module>
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
/// ````
/// // Returns a boxed backend, configuration is done through
/// // initialization protobuf messages
/// fn new_backend() -> Box<Backend>;
///
/// // Yields the supported behavior of a trait object returned by this backend
/// fn supported_behavior() -> SupportedBehavior
/// ```
///
/// Note that the trait object will properly call `drop` if implemented.
///
/// Any backend plugin must additionally implement the crate-level `new` function
/// that returns the backend as a `Box<Module>`.
pub trait Backend: Module {
    /// Convenience alias for the crate-level supported behavior function.
    /// This takes `&self` for convenience of the core plugin wrapper.
    fn supported_behavior(&self) -> SupportedBehavior;

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