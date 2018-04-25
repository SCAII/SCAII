extern crate rand;
extern crate serde;
extern crate serde_cbor;
#[macro_use]
extern crate serde_derive;
extern crate shred;
#[macro_use]
extern crate shred_derive;
extern crate sky_rts;
extern crate specs;

mod legacy;

use std::path::Path;

use sky_rts::engine::Rts;
use specs::prelude::*;

fn main() {
    use std::env::args;
    use std::path::PathBuf;
    use std::process::exit;

    let path = match args().next() {
        Some(arg) => PathBuf::from(arg),
        None => {
            println!("Must supply a replay file to convert!");
            exit(1);
        }
    };

    let mut de_curr = sky_rts::engine::systems::DeserializeSystem;
    let mut rts = Rts::new();

    if try_deser(&path, &mut rts, &mut de_curr).is_ok() {
        println!("File already works with newest version, nothing to be done.");
        exit(0);
    }
}

fn try_deser<'a, P: AsRef<Path>, S: RunNow<'a>>(
    path: &P,
    rts: &'a mut Rts,
    sys: &mut S,
) -> Result<(), String> {
    use sky_rts::engine::resources::SerError;
    {
        sys.run_now(&rts.world.res);
    }
    let res = rts.world.read_resource::<SerError>().0.clone();
    res
}
