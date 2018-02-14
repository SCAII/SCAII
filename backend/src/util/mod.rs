//! Utility functions for RTS-wide use

/// The seed size of the RNG
const SEED_SIZE: usize = 256;

use rand::{Isaac64Rng, Rng, SeedableRng};
use rand;

use scaii_defs::protos::MultiMessage;

/// Create a new seeded RNG.
pub fn make_rng() -> Isaac64Rng {
    Isaac64Rng::from_seed(&seed()[..])
}

/// Reseed the RNG so the state diverges.
pub fn diverge(rng: &mut Isaac64Rng) {
    rng.reseed(&seed()[..]);
}

/// Randomly create a new seed using the thread local RNG.
fn seed() -> [u64; SEED_SIZE] {
    let mut buf = [0; SEED_SIZE];
    for i in 0..SEED_SIZE {
        buf[i] = rand::thread_rng().gen();
    }
    buf
}

/// Create an acknowledgement message
/// to ping back the Agent.
#[allow(dead_code)]
pub fn ack_msg() -> MultiMessage {
    use scaii_defs::protos::{Ack, ScaiiPacket};
    use scaii_defs::protos;

    let scaii_packet = ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(protos::endpoint::Endpoint::Backend(
                protos::BackendEndpoint {},
            )),
        },
        dest: protos::Endpoint {
            endpoint: Some(protos::endpoint::Endpoint::Agent(protos::AgentEndpoint {})),
        },
        specific_msg: Some(protos::scaii_packet::SpecificMsg::Ack(Ack {})),
    };

    MultiMessage {
        packets: vec![scaii_packet],
    }
}
