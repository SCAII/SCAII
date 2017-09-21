mod universal_messages;

pub use self::universal_messages::*;

pub type PacketDest = ScaiiPacket_Endpoint;

use errors::ModuleNoNameError;

use std::fmt::{Display, Formatter};
use std::fmt;

/// Merges a bunch of `MultiMessage`s into a new one.
///
/// The result will preserve the order of the input multimessages.
///
/// If `msgs` is empty, `None` is returned. If it's of length 1,
/// that `MultiMessage` will be returned without modification.
pub fn merge_multi_messages(mut msgs: Vec<MultiMessage>) -> Option<MultiMessage> {
    if msgs.len() == 0 {
        return None;
    } else if msgs.len() == 1 {
        return msgs.pop();
    }

    // Scope so split_first_mut borrow ends
    {
        let (first, tail) = msgs.split_first_mut().unwrap();

        for msg in tail {
            for packet in msg.take_packets().into_iter() {
                first.mut_packets().push(packet);
            }
        }
    }

    Some(msgs.swap_remove(0))
}


/// The destination or source of a routed message
///
/// Just a Rust-friendly version of
/// Of the dest/module_name or src/src_name
/// pieces of a ScaiiPacket
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum RouterEndpoint {
    Backend,
    Agent,
    Core,
    Module { name: String },
}

impl RouterEndpoint {
    /// Converts a raw package destination and
    /// module name to this type, can fail
    /// if you specify a destination as Module
    /// with no name.
    pub fn from_packet_dest(
        dest: PacketDest,
        module_name: Option<String>,
    ) -> Result<Self, ModuleNoNameError> {
        use self::RouterEndpoint::*;
        Ok(match dest {
            ScaiiPacket_Endpoint::BACKEND => Backend,
            ScaiiPacket_Endpoint::AGENT => Agent,
            ScaiiPacket_Endpoint::CORE => Core,
            ScaiiPacket_Endpoint::MODULE => Module {
                name: match module_name {
                    None => return Err(ModuleNoNameError {}),
                    Some(name) => name,
                },
            },
        })
    }

    /// Creates a RouterEndpoint from a ScaiiPacket's dest fields, failing if no name
    /// is provided for a module.
    pub fn from_scaii_packet_dest(packet: &ScaiiPacket) -> Result<Self, ModuleNoNameError> {
        Self::from_packet_dest(
            packet.get_dest(),
            if packet.has_module_name() {
                Some(packet.get_module_name().to_string())
            } else {
                None
            },
        )
    }

    /// Creates a RouterEndpoint from a ScaiiPacket's source fields, failing if no name
    /// is provided for a module.
    pub fn from_scaii_packet_src(packet: &ScaiiPacket) -> Result<Self, ModuleNoNameError> {
        Self::from_packet_dest(
            packet.get_source(),
            if packet.has_source_name() {
                Some(packet.get_source_name().to_string())
            } else {
                None
            },
        )
    }

    /// Changes this back to a packet endpoint and string. Usable for sending
    /// messages.
    pub fn to_packet_dest(&self) -> (ScaiiPacket_Endpoint, Option<&str>) {
        use self::RouterEndpoint::*;
        match *self {
            Backend => (ScaiiPacket_Endpoint::BACKEND, None),
            Agent => (ScaiiPacket_Endpoint::AGENT, None),
            Core => (ScaiiPacket_Endpoint::CORE, None),
            Module { ref name } => (ScaiiPacket_Endpoint::MODULE, Some(name)),
        }
    }
}

impl Display for RouterEndpoint {
    fn fmt(&self, fmt: &mut Formatter) -> Result<(), fmt::Error> {

        match *self {
            RouterEndpoint::Backend => write!(fmt, "{}", "backend"),
            RouterEndpoint::Agent => write!(fmt, "{}", "agent"),
            RouterEndpoint::Core => write!(fmt, "{}", "core"),
            // The (module) helps disambiguate if someone registered a module with,
            // say, the name "backend". They'd see "backend (module)" instead.
            RouterEndpoint::Module { ref name } => write!(fmt, "{} (module)", name),
        }

    }
}