//! Utility functions for RTS-wide use

use rand::{Isaac64Rng, SeedableRng};
use rand;

use scaii_defs::protos::MultiMessage;

/// Create a new seeded RNG.
pub fn make_rng() -> Isaac64Rng {
    Isaac64Rng::from_rng(&mut rand::thread_rng()).expect("Could not make RNG")
}

/// Reseed the RNG so the state diverges.
pub fn diverge(rng: &mut Isaac64Rng) {
    *rng = Isaac64Rng::from_rng(&mut rand::thread_rng()).expect("Could not reseed RNG");
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
