use scaii_defs::{Backend, Module, BackendSupported};
use scaii_defs::protos::{MultiMessage, ScaiiPacket, RustFfiConfig};

use std::error::Error;
use std::ops::{Deref, DerefMut, Drop};

pub enum LoadedAs {
    Module(Box<Module>, String),
    Backend(Box<Backend>),
}

pub fn init_ffi(args: RustFfiConfig) -> Result<LoadedAs, Box<Error>> {
    use internal::RcLibrary;
    use libloading::Library;
    use scaii_defs::protos::init_as::InitAs;
    use scaii_defs::protos::ModuleInit;

    let mu = &::internal::OPEN_LIBS;
    {
        let mut lib_map = mu.lock()?;
        let plugin_path = args.plugin_path;

        //rclib = rust-call lib
        let rclib = lib_map.entry(plugin_path.clone()).or_insert(RcLibrary {
            lib: Library::new(&plugin_path)?,
            uses: 1,
        });

        match args.init_as.init_as.ok_or::<Box<Error>>(Err(
            "Malformed InitAs field in RustFfi"
                .to_string(),
        )?)? {
            InitAs::Backend(_) => {
                let rclib = unsafe { rclib.lib.get::<fn() -> Box<Backend>>(b"new_backend\0")? };
                Ok(LoadedAs::Backend(Box::new(RustDynamicBackend {
                    backend: rclib(),
                    plugin_path: plugin_path,
                })))
            }
            InitAs::Module(ModuleInit { name }) => {
                let rclib = unsafe { rclib.lib.get::<fn(&str) -> Box<Module>>(b"new\0")? };
                Ok(LoadedAs::Module(
                    Box::new(RustDynamicModule {
                        module: rclib(&name),
                        plugin_path: plugin_path,
                    }),
                    name,
                ))
            }
        }
    }
}

/// A backend loaded using FFI and
/// Rust calling conventions. See the
/// `Module` trait in `scaii_defs` for API info.
struct RustDynamicBackend {
    backend: Box<Backend>,
    plugin_path: String,
}

impl RustDynamicBackend {}

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
                let rclib = lib_map.get_mut(&self.plugin_path).unwrap();

                rclib.uses -= 1;
                rclib.uses
            };

            if uses == 0 {
                lib_map.remove(&self.plugin_path);
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
    fn supported_behavior(&self) -> BackendSupported {
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

struct RustDynamicModule {
    module: Box<Module>,
    plugin_path: String,
}

impl Deref for RustDynamicModule {
    type Target = Module;
    fn deref(&self) -> &Self::Target {
        &*self.module
    }
}

impl DerefMut for RustDynamicModule {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut *self.module
    }
}

impl Drop for RustDynamicModule {
    // Handle gracefully unloading plugins no longer in use
    fn drop(&mut self) {
        let mu = &::internal::OPEN_LIBS;
        {
            // We can't handle errors in drop so we have to pray
            // panic in drop is very bad, but we have no choice
            let mut lib_map = mu.lock().unwrap();

            // Have to do this so the borrow ends and we can remove if need be
            let uses = {
                let rclib = lib_map.get_mut(&self.plugin_path).unwrap();

                rclib.uses -= 1;
                rclib.uses
            };

            if uses == 0 {
                lib_map.remove(&self.plugin_path);
            }
        }
    }
}

impl Module for RustDynamicModule {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        self.module.process_msg(msg)
    }

    fn get_messages(&mut self) -> MultiMessage {
        self.module.get_messages()
    }
}
