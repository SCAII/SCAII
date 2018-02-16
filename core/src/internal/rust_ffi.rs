use scaii_defs::{Backend, BackendSupported, Module};
use scaii_defs::protos::{MultiMessage, RustFfiConfig, ScaiiPacket};

use std::error::Error;
use std::ops::{Deref, DerefMut};

use super::LoadedAs;

pub fn init_ffi(args: RustFfiConfig) -> Result<LoadedAs, Box<Error>> {
    use std::env;
    use libloading::Library;
    use scaii_defs::protos::init_as::InitAs;
    use scaii_defs::protos::ModuleInit;

    let mu = &::internal::OPEN_LIBS;
    {
        let mut lib_map = mu.lock()?;
        let plugin_path = format!(
            "{}/.scaii/{}",
            env::var("HOME").expect("No home dir?"),
            args.plugin_path,
        );

        //rclib = rust-call lib
        let lib = lib_map
            .entry(plugin_path.clone())
            .or_insert(Library::new(&plugin_path).expect("Invalid library path"));

        match args.clone()
            .init_as
            .init_as
            .ok_or_else::<Box<Error>, _>(|| {
                From::from(format!("Malformed InitAs field in RustFfi {:?}", args))
            })? {
            InitAs::Backend(_) => {
                let lib = unsafe { lib.get::<fn() -> Box<Backend>>(b"new_backend\0")? };
                Ok(LoadedAs::Backend(Box::new(RustDynamicBackend {
                    backend: lib(),
                    plugin_path: plugin_path,
                })))
            }
            InitAs::Module(ModuleInit { name }) => {
                let lib = unsafe { lib.get::<fn(&str) -> Box<Module>>(b"new\0")? };
                Ok(LoadedAs::Module(
                    Box::new(RustDynamicModule {
                        module: lib(&name),
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
    pub plugin_path: String,
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
    pub plugin_path: String,
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

impl Module for RustDynamicModule {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        self.module.process_msg(msg)
    }

    fn get_messages(&mut self) -> MultiMessage {
        self.module.get_messages()
    }
}

#[test]
fn load_destroy() {
    use scaii_defs::protos::{BackendInit, InitAs};
    use scaii_defs::protos::init_as;

    let args = RustFfiConfig {
        init_as: InitAs {
            init_as: Some(init_as::InitAs::Backend(BackendInit {})),
        },
        plugin_path: "../../sky-rts/backend/target/debug/backend.dll".to_string(),
    };

    init_ffi(args).unwrap();

    println!("Initialized")
}
