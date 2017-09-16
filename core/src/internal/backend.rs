use scaii_defs::{Backend, EnvironmentInitArgs};

use std::error::Error;
use std::ops::{Deref, DerefMut, Drop};

#[cfg(not(release))]
use scaii_defs::Language;

pub struct RustDynamicBackend {
    backend: Box<Backend>,
    name: String,
}

impl RustDynamicBackend {
    pub fn new(args: EnvironmentInitArgs, backend_cfg_toml: &str) -> Result<Self, Box<Error>> {
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


            let rclib = unsafe { rclib.lib.get::<fn(&str) -> Box<Backend>>(b"new\0")? };
            Ok(RustDynamicBackend {
                backend: rclib(backend_cfg_toml),
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