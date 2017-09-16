pub mod backend;
pub mod router;

use libloading::Library;

use std::sync::Mutex;
use std::collections::HashMap;

struct RcLibrary {
    pub uses: usize,
    pub lib: Library,
}

lazy_static!{
    static ref OPEN_LIBS: Mutex<HashMap<String,RcLibrary>> = {
        Mutex::new(HashMap::new())
    };
}