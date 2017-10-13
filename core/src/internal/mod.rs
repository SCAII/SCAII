pub mod router;
pub mod agent;
pub mod rust_ffi;
pub mod rpc;

use libloading::Library;

use scaii_defs::{Module, Backend};

pub enum LoadedAs {
    Module(Box<Module>, String),
    Backend(Box<Backend>),
}

use std::sync::Mutex;
use std::collections::HashMap;

/// A reference counted library, used to keep
/// one instance of a dynamic library open, globally, for the lifetimes
/// of any registered modules that load it.
struct RcLibrary {
    pub uses: usize,
    pub lib: Library,
}

// Mutex protect our dynamic libraries for safety.
lazy_static!{
    static ref OPEN_LIBS: Mutex<HashMap<String,RcLibrary>> = {
        Mutex::new(HashMap::new())
    };
}
