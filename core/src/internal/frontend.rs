use scaii_defs::{Msg, Module, Frontend};

use std::error::Error;

/// A publisher frontend is a dummy frontend wrapper
/// that is used for a frontend that has loaded core
/// and is "driving" the program (aka the typical
/// use case).
///
/// Its only member is an incoming messages queue for calls
/// to next_msg.
pub struct PublisherFrontend {
    pub incoming_messages: Vec<Msg>,
}

impl Module for PublisherFrontend {
    fn process_msg(&mut self, msg: &Msg) -> Result<(), Box<Error>> {
        self.incoming_messages.push(msg.clone());
        Ok(())
    }

    // Get messages is for outgoing only,
    // and since the frontend is a publisher
    // (driving) it will send responses itself
    fn get_messages(&mut self) -> Vec<Msg> {
        Vec::new()
    }
}

impl Frontend for PublisherFrontend {}