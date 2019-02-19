pub mod agent;
pub mod recorder;
pub mod router;
pub mod rpc;
pub mod static_backends;

use scaii_defs::Module;

pub enum LoadedAs {
    Module(Box<Module>, String),
}
