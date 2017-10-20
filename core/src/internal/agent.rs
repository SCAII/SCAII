use scaii_defs::{Agent, Module};
use scaii_defs::protos::{MultiMessage, ScaiiPacket};

use std::error::Error;

/// A publisher frontend is a dummy frontend wrapper
/// that is used for a frontend that has loaded core
/// and is "driving" the program (aka the typical
/// use case).
///
/// Its only member is an incoming messages queue for calls
/// to `next_msg`.
#[derive(Clone, Default, PartialEq, Debug)]
pub struct PublisherAgent {
    pub incoming_messages: Vec<ScaiiPacket>,
}

impl PublisherAgent {
    pub fn new() -> Self {
        PublisherAgent { incoming_messages: Vec::with_capacity(5) }
    }
}

impl Module for PublisherAgent {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        self.incoming_messages.push(msg.clone());
        Ok(())
    }

    // Get messages is for outgoing only,
    // and since the frontend is a publisher
    // (driving) it will send responses itself
    fn get_messages(&mut self) -> MultiMessage {
        MultiMessage { packets: Vec::new() }
    }
}

impl Agent for PublisherAgent {}
