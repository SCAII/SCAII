use std::path::PathBuf;
use std::ops::Drop;
use std::fmt;
use std::fmt::{Formatter, Display};
use internal::router::Module;

use scaii_defs::{Msg, SupportedBehavior};
use std::error::Error;

/* We're unable to deal with lifetime weirdness so we use the OS ones */

#[cfg(unix)]
use libloading::os::unix::{Library, Symbol};
#[cfg(windows)]
use libloading::os::windows::{Library, Symbol};

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

/// The Backend trait provides specialized methods for Backend modules
trait Backend: Module {
    /// Returns a Scaii::SupportedBehavior indicating this Module's
    /// optional functionality (if any)
    fn supported_behavior(&mut self) -> SupportedBehavior;

    /// Non-divergently Serializes the state in the target buffer, or returns an error on improper
    /// serialization. Default implementation is that serialization is unsupported.
    fn serialize(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        Err(Box::new(UnsupportedError))
    }

    /// Non-divergently deserializes the state in the target buffer, or returns an error on an incorrect
    /// buffer. Default implementation is that serialization is unsupported.
    fn deserialize(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        Err(Box::new(UnsupportedError))
    }

    /// Divergently Serializes the state in the target buffer, or returns an error on improper
    /// serialization. Default implementation is that serialization is unsupported.
    fn serialize_diverging(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        Err(Box::new(UnsupportedError))
    }

    /// Divergently deserializes the state in the target buffer, or returns an error on an incorrect
    /// buffer. Default implementation is that serialization is unsupported.
    fn deserialize_diverging(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        Err(Box::new(UnsupportedError))
    }
}

/// Makes sure we don't have a memory leak on error, and ensures we drop
/// the backend environment before the link to the library.
struct RustDroppableEnv {
    ptr: Box<BackendInstance>,
    drop_sym: Symbol<fn(Box<BackendInstance>)>,
    lib: Library,
}

impl Drop for RustDroppableEnv {
    fn drop(&mut self) {
        use std::mem;
        // make a value that's safe to Rust to autodrop
        let mut dummy = Box::new(BackendInstance);
        mem::swap(&mut dummy, &mut self.ptr);
        (self.drop_sym)(dummy)
    }
}

// Opaque pointer
#[repr(C)]
struct BackendInstance;

/// The RustDynamicBackend provides a plugin loader for Rust libraries.
/// It expects the following symbols to be exported and unmangled:
///
///    // Initializes a new instance of the backend environment
///    // The cfg_toml will be in the format specified by the GameWrapper
///    // and environment.
///    fn new(cfg_toml: &str) -> Box<OpaqueStruct>;
///
///    // Manually frees resources, in most cases this function
///    // can be a simple passthrough to let
///    // the struct drop naturally on the implementer's end
///    fn drop(Box<OpaqueStruct>)
///
///    // Processes the given protobuf message, yields an error if the message
///    // cannot be read
///    fn process_msg(&mut OpaqueStruct, &scaii_decs::Msg) -> Result<(), Box<Error>>
///
///    // Gives the current outgoing message queue to the core for routing,
///    // this also clears the queue of any messages.
///    fn get_messages(&mut OpqueStruct) -> Vec<scaii_decs::Msg>
///
///    // Returns the functions supported by this backend
///    fn supported_behavior(&mut OpaqueStruct) -> scaii_decs::SupportedBehavior
///
/// Additionally, if supported, the following functions will be loaded provided the
/// `SupportedBehavior` struct indicates the corresponsing functionality.
///
///    // Performs a non-diverging serialization of the game state into the target buffer
///    // and returns it.
///    // If the buffer is None, it creates a new buffer.
///    //
///    // Returns an error is the state cannot be serialized
///    fn serialize(&mut OpaqueStruct, buf: Option<Vec<u8>>) -> Result<Vec<u8>,Box<Error>>
///
///    // Performs a non-diverging load of a serialized state from the
///    // input buffer. Outputs an error if the state cannot be deserialized.
///    fn deserialize(&mut OpaqueStruct, buf: &[u8]) -> Result<(),Box<Error>>
///
///    // Performs a diverging serialization of the game state into the target buffer
///    // and returns it.
///    // If the buffer is None, it creates a new buffer.
///    //
///    // Returns an error is the state cannot be serialized
///    fn serialize_diverging(&mut OpaqueStruct, buf: Option<Vec<u8>>) -> Result<Vec<u8>,Box<Error>>
///
///    // Performs a diverging load of a serialized state from the
///    // input buffer. Outputs an error if the state cannot be deserialized.
///    fn deserialize_diverging(&mut OpaqueStruct, buf: &[u8]) -> Result<(),Box<Error>>
///
/// Where `OpaqueStruct` implies that this loader simply treats it as a pointer.
///
/// For more info on diverging and non-diverging serialization, please see the more general
/// SCAII definitions.
pub struct RustDynamicBackend {
    /* router::Module impl */
    env: RustDroppableEnv,
    process_msg_sym: Symbol<fn(&mut BackendInstance, &Msg) -> Result<(), Box<Error>>>,
    get_messages_sym: Symbol<fn(&mut BackendInstance) -> Vec<Msg>>,

    /* Backend Impl */
    supported_behavior_sym: Symbol<fn(&mut BackendInstance) -> SupportedBehavior>,

    /* Optional serialization functions */
    serialize_sym:
        Option<Symbol<fn(&mut BackendInstance, Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>>>>,
    deserialize_sym: Option<Symbol<fn(&mut BackendInstance, &[u8]) -> Result<(), Box<Error>>>>,

    serialize_diverging_sym:
        Option<Symbol<fn(&mut BackendInstance, Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>>>>,
    deserialize_diverging_sym:
        Option<Symbol<fn(&mut BackendInstance, &[u8]) -> Result<(), Box<Error>>>>,
}

impl Module for RustDynamicBackend {
    /// Loads a new Rust plugin and sets the extern functions.
    /// Note, if this errors anywhere other than finding the symbol
    /// "new", a memory leak will occur.
    fn new(cfg: &str, backend_cfg: &str) -> Result<Self, Box<Error>> {
        use scaii_defs::{EnvironmentInitArgs, SerializationStyle};
        use toml;

        let args: EnvironmentInitArgs = toml::from_str(cfg)?;

        let lib = Library::new(args.plugin_path)?;

        // This looks really ugly and scary but it's just a bunch of symbol loading
        // by name
        unsafe {
            // Load drop FIRST, because if we fail at loading, we need to free memory
            // so we need to be sure this exists first.
            let drop_sym = lib.get(b"process_msg\0")?;

            /* Create our backend */
            // Since we're not storing `new` in our struct, we want this to drop here
            // or the compiler gets cranky
            let mut backend = {
                let new: Symbol<
                    fn(&str) -> Result<Box<BackendInstance>, Box<Error>>,
                > = lib.get(b"new\0")?;
                new(backend_cfg)?
            };

            let mut env = RustDroppableEnv {
                ptr: backend,
                drop_sym: drop_sym,
                lib: lib,
            };

            /* Initialize router::Module functions */
            let process_msg_sym = env.lib.get(b"process_msg\0")?;


            let get_messages_sym = env.lib.get(b"get_messages\0")?;


            /* Load supported behavior and call to use for serialization loading */
            // The compiler isn't smart enough to do inference here when we call it
            // before putting it in the struct for some reason, so we have to tell it
            // the type.
            let supported_behavior_sym =
                env.lib
                    .get::<fn(&mut BackendInstance) -> SupportedBehavior>(b"supported_behavior\0")?;

            let ser_supported = supported_behavior_sym(&mut *env.ptr).serialization;

            /* Load serialization functions as per spec */
            let (serialize_sym, deserialize_sym) = match ser_supported {
                SerializationStyle::NondivergingOnly |
                SerializationStyle::Full => {
                    (
                        Some(env.lib.get(b"serialize\0")?),
                        Some(env.lib.get(b"deserialize\0")?),
                    )
                }
                _ => (None, None),
            };

            let (serialize_diverging_sym, deserialize_diverging_sym) = match ser_supported {
                SerializationStyle::NondivergingOnly |
                SerializationStyle::DivergingOnly |
                SerializationStyle::Full => {
                    (
                        Some(env.lib.get(b"serialize_diverging\0")?),
                        Some(env.lib.get(b"deserialize_diverging\0")?),
                    )
                }
                SerializationStyle::None => (None, None),
            };

            // TODO: check that moving lib here is okay.
            // I can't see a reason it wouldn't be, but who knows.
            Ok(RustDynamicBackend {
                env: env,
                process_msg_sym: process_msg_sym,
                get_messages_sym: get_messages_sym,
                supported_behavior_sym: supported_behavior_sym,
                serialize_sym: serialize_sym,
                deserialize_sym: deserialize_sym,
                serialize_diverging_sym: serialize_diverging_sym,
                deserialize_diverging_sym: deserialize_diverging_sym,
            })
        }
    }

    fn process_msg(&mut self, msg: &Msg) -> Result<(), Box<Error>> {
        // These parens are required or you get a "field, not a method"
        // error because it thinks you're trying to call "self.process_msg_sym"
        // as a method
        (self.process_msg_sym)(&mut *self.env.ptr, msg)
    }

    fn get_messages(&mut self) -> Vec<Msg> {
        (self.get_messages_sym)(&mut *self.env.ptr)
    }
}

impl Backend for RustDynamicBackend {
    fn supported_behavior(&mut self) -> SupportedBehavior {
        (self.supported_behavior_sym)(&mut *self.env.ptr)
    }

    fn serialize(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        match self.serialize_sym {
            Some(ref serialize) => serialize(&mut *self.env.ptr, into),
            None => Err(Box::new(UnsupportedError)),
        }
    }

    fn deserialize(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        match self.deserialize_sym {
            Some(ref deserialize) => deserialize(&mut *self.env.ptr, buf),
            None => Err(Box::new(UnsupportedError)),
        }
    }

    fn serialize_diverging(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        match self.serialize_diverging_sym {
            Some(ref serialize) => serialize(&mut *self.env.ptr, into),
            None => Err(Box::new(UnsupportedError)),
        }
    }

    fn deserialize_diverging(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        match self.deserialize_diverging_sym {
            Some(ref deserialize) => deserialize(&mut *self.env.ptr, buf),
            None => Err(Box::new(UnsupportedError)),
        }
    }
}