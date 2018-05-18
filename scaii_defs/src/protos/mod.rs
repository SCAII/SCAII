include!(concat!(env!("OUT_DIR"), "/scaii.common.rs"));

mod proto_util;
pub use self::proto_util::*;

use protos;
use protos::user_command::UserCommandType;
use std;
use std::fmt;
/// Merges a bunch of `MultiMessage`s into a new one.
///
/// The result will preserve the order of the input multimessages.
///
/// If `msgs` is empty, `None` is returned. If it's of length 1,
/// that `MultiMessage` will be returned without modification.
pub fn merge_multi_messages(mut msgs: Vec<MultiMessage>) -> Option<MultiMessage> {
    if msgs.is_empty() {
        return None;
    } else if msgs.len() == 1 {
        return msgs.pop();
    }

    // Scope so split_first_mut borrow ends
    {
        let (first, tail) = msgs.split_first_mut().unwrap();

        for msg in tail {
            for packet in msg.packets.drain(..) {
                first.packets.push(packet);
            }
        }
    }

    Some(msgs.swap_remove(0))
}

pub fn packet_from_entity_list(entities: Vec<Entity>) -> ScaiiPacket {
    ScaiiPacket {
        src: Endpoint {
            endpoint: Some(endpoint::Endpoint::Backend(BackendEndpoint {})),
        },
        dest: Endpoint {
            endpoint: Some(endpoint::Endpoint::Module(ModuleEndpoint {
                name: "viz".to_string(),
            })),
        },

        specific_msg: Some(scaii_packet::SpecificMsg::Viz(Viz {
            entities: entities,
            ..Default::default()
        })),
    }
}

pub fn get_user_command_args(scaii_pkt: &ScaiiPacket) -> Vec<String> {
    let mut result: Vec<String> = Vec::new();
    let specific_msg = &scaii_pkt.specific_msg;
    match specific_msg {
        &Some(scaii_packet::SpecificMsg::UserCommand(protos::UserCommand {
            command_type: _,
            args: ref args_list,
        })) => {
            result = args_list.clone();
        }
        _ => {}
    };
    result
}

pub fn is_user_command_pkt(scaii_pkt: &ScaiiPacket) -> bool {
    let specific_msg = &scaii_pkt.specific_msg;
    match specific_msg {
        &Some(scaii_packet::SpecificMsg::UserCommand(protos::UserCommand {
            command_type: _,
            args: _,
        })) => true,
        _ => false,
    }
}

pub fn is_error_pkt(scaii_pkt: &ScaiiPacket) -> bool {
    let specific_msg = &scaii_pkt.specific_msg;
    match specific_msg {
        &Some(scaii_packet::SpecificMsg::Err(protos::Error {
            description: _,
            fatal: _,
            error_info: _,
        })) => true,
        _ => false,
    }
}

pub fn get_user_command_type(
    scaii_pkt: &ScaiiPacket,
) -> Result<UserCommandType, Box<ProtobufEnumWorkaroundError>> {
    let specific_msg = &scaii_pkt.specific_msg;

    match specific_msg {
        &Some(scaii_packet::SpecificMsg::UserCommand(protos::UserCommand {
            command_type: x,
            args: _,
        })) => match x {
            0 => Ok(UserCommandType::None),
            1 => Ok(UserCommandType::Explain),
            2 => Ok(UserCommandType::Pause),
            3 => Ok(UserCommandType::Resume),
            4 => Ok(UserCommandType::Rewind),
            5 => Ok(UserCommandType::PollForCommands),
            6 => Ok(UserCommandType::JumpToStep),
            7 => Ok(UserCommandType::JumpCompleted),
            8 => Ok(UserCommandType::SetSpeed),
            9 => Ok(UserCommandType::SelectFile),
            10 => Ok(UserCommandType::SelectFileComplete),
            _ => Err(Box::new(ProtobufEnumWorkaroundError::new(
                "likely added new UserCommandType and forgot to change this hack.",
            ))),
        },
        _ => Err(Box::new(ProtobufEnumWorkaroundError::new(
            "expected a UserCommand packet",
        ))),
    }
}

pub fn get_error_from_pkt(scaii_pkt: &ScaiiPacket) -> Result<protos::Error, &'static str> {
    let specific_msg = scaii_pkt.specific_msg.clone();
    match specific_msg {
        Some(scaii_packet::SpecificMsg::Err(x)) => Ok(x),
        _ => Err("Asked for protos::Error from non Err ScaiiPacket.Backend"),
    }
}
//?????
// pub fn get_error_from_pkt2(scaii_pkt: &ScaiiPacket) -> Result<protos::Error, &'static str> {
//     let specific_msg = &scaii_pkt.specific_msg;
//     match specific_msg {
//         &Some(scaii_packet::SpecificMsg::Err(ref x)) => Ok(x),
//         _ => Err("Asked for protos::Error from non Err ScaiiPacket.Backend"),
//     }
// }

#[derive(Debug)]
pub struct ProtobufEnumWorkaroundError {
    details: String,
}

impl ProtobufEnumWorkaroundError {
    fn new(msg: &str) -> ProtobufEnumWorkaroundError {
        ProtobufEnumWorkaroundError {
            details: msg.to_string(),
        }
    }
}

impl fmt::Display for ProtobufEnumWorkaroundError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.details)
    }
}

impl std::error::Error for ProtobufEnumWorkaroundError {
    fn description(&self) -> &str {
        &self.details
    }
}
