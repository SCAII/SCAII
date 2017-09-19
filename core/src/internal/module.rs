use scaii_defs::{Module, EnvironmentInitArgs, Msg};

use std::error::Error;
use std::ops::{Deref, DerefMut, Drop};

#[cfg(debug_assertions)]
use scaii_defs::Language;

pub struct RustDynamicModule {
    backend: Box<Module>,
    name: String,
}

impl RustDynamicModule {
    pub fn new(args: EnvironmentInitArgs, module_cfg_toml: &str) -> Result<Self, Box<Error>> {
        use internal::RcLibrary;
        use libloading::Library;
        debug_assert!(args.language == Language::RustFFI);

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


            let rclib = unsafe { rclib.lib.get::<fn(&str) -> Box<Module>>(b"new\0")? };
            Ok(RustDynamicModule {
                backend: rclib(module_cfg_toml),
                name: name,
            })

        }
    }
}

impl Deref for RustDynamicModule {
    type Target = Module;
    fn deref(&self) -> &Self::Target {
        &*self.backend
    }
}

impl DerefMut for RustDynamicModule {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut *self.backend
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

impl Module for RustDynamicModule {
    fn process_msg(&mut self, msg: &Msg) -> Result<(), Box<Error>> {
        self.backend.process_msg(msg)
    }

    fn get_messages(&mut self) -> Vec<Msg> {
        self.backend.get_messages()
    }
}
