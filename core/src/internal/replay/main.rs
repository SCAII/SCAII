extern crate scaii_core;
use scaii_core::Environment;

struct Replay<'a> {
    environment: Environment,
    backend: &'a (ReplayBackend + 'a),
}

impl<'a> Replay<'a> {
    
}

pub trait ReplayBackend {
    fn init(&self);
    fn start_game(&self);
}

struct StandinRTS {

}
impl ReplayBackend for StandinRTS {
    fn start_game(&self) {
        println!("standin RTS Game Started");
    }
    fn init(&self) {

    }
}
fn main() {
    let rts = StandinRTS {

    };
    let replay = Replay {
        environment:  Environment::new(),
        backend: &rts,
    };
}