use std::path::PathBuf;
use libloading::Library;
use scaii_defs::Msg;

trait Backend {
    fn new(cfg: &str) -> Self;

    fn process_msg(&mut self, msg: &Msg);
    fn get_messages(&mut self) -> &[Msg];
}

pub struct RustDynamicBackend {
    lib: Library,
    plugin_name: String,
}
