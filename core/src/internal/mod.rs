pub mod router;
pub mod agent;
pub mod rust_ffi;
pub mod rpc;
pub mod recorder;

use libloading::Library;

use scaii_defs::{Backend, Module};

pub enum LoadedAs {
    Module(Box<Module>, String),
    Backend(Box<Backend>),
}

use std::sync::Mutex;
use std::collections::HashMap;

// Mutex protect our dynamic libraries for safety.
lazy_static!{
    static ref OPEN_LIBS: Mutex<HashMap<String,Library>> = {
        Mutex::new(HashMap::new())
    };
}
