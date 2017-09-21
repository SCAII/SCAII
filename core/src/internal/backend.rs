use scaii_defs::{Backend, Module, RustFFIArgs, SupportedBehavior};
use scaii_defs::protos::{MultiMessage, ScaiiPacket};

use std::error::Error;
use std::ops::{Deref, DerefMut, Drop};

/// A backend loaded using FFI and
/// Rust calling conventions. See the
/// `Module` trait in `scaii_defs` for API info.
pub struct RustDynamicBackend {
    backend: Box<Backend>,
    name: String,
}

impl RustDynamicBackend {
    pub fn new(args: RustFFIArgs) -> Result<Self, Box<Error>> {
        use internal::RcLibrary;
        use libloading::Library;

        let mu = &::internal::OPEN_LIBS;
        {
            let mut lib_map = mu.lock()?;
            let name = args.plugin_path
                .to_str()
                .expect(
                    "Path created from String cannot be turned back into String?",
                )
                .to_string();

            let rclib = lib_map.entry(name.clone()).or_insert(RcLibrary {
                lib: Library::new(args.plugin_path)?,
                uses: 1,
            });

            //rclib = rust-call lib
            let rclib = unsafe { rclib.lib.get::<fn() -> Box<Backend>>(b"new_backend\0")? };
            Ok(RustDynamicBackend {
                backend: rclib(),
                name: name,
            })

        }
    }
}

impl Deref for RustDynamicBackend {
    type Target = Backend;
    fn deref(&self) -> &Self::Target {
        &*self.backend
    }
}

impl DerefMut for RustDynamicBackend {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut *self.backend
    }
}

impl Drop for RustDynamicBackend {
    // Handle gracefully unloading plugins no longer in use
    fn drop(&mut self) {
        let mu = &::internal::OPEN_LIBS;
        {
            // We can't handle errors in drop so we have to pray
            // panic in drop is very bad, but we have no choice
            let mut lib_map = mu.lock().unwrap();

            // Have to do this so the borrow ends and we can remove if need be
            let uses = {
                let rclib = lib_map.get_mut(&self.name).unwrap();

                rclib.uses -= 1;
                rclib.uses
            };

            if uses == 0 {
                lib_map.remove(&self.name);
            }
        }
    }
}

impl Module for RustDynamicBackend {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        self.backend.process_msg(msg)
    }

    fn get_messages(&mut self) -> MultiMessage {
        self.backend.get_messages()
    }
}

impl Backend for RustDynamicBackend {
    fn supported_behavior(&self) -> SupportedBehavior {
        self.backend.supported_behavior()
    }

    fn serialize(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        self.backend.serialize(into)
    }

    fn deserialize(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        self.backend.deserialize(buf)
    }

    fn serialize_diverging(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        self.backend.serialize_diverging(into)
    }

    fn deserialize_diverging(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        self.backend.deserialize_diverging(buf)
    }
}