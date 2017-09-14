use libloading::Library;

pub trait Backend {}

pub struct DynLibBackend {
    lib: Library,
}

impl Backend for DynLibBackend {}