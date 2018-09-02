use super::*;
use bincode::{deserialize_from, Infinite};
use protos::cfg::WhichModule;
use protos::scaii_packet::SpecificMsg;
use protos::ScaiiPacket;
use scaii_core;
pub use scaii_core::load_replay_file;
use scaii_core::{ReplayAction, SerializedProtosSerializationResponse};
use scaii_defs::protos;
use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

#[allow(dead_code)]
fn print_replay_actions(replay_vec: &Vec<ReplayAction>) {
    let mut count = 0;
    println!("");
    println!(
        "-------------------   Here are the replay actions with numbers  --------------------"
    );
    for replay_action in replay_vec {
        match replay_action {
            &ReplayAction::Header(_) => {
                println!("loaded ReplayAction::Header   {}", count);
            }
            &ReplayAction::Delta(_) => {
                println!("loaded ReplayAction::Delta    {}", count);
            }
            &ReplayAction::Keyframe(_, _) => {
                println!("loaded ReplayAction::Keyframe {}", count);
            }
        }
        count = count + 1;
    }
    println!("");
    println!("");
}

pub fn set_replay_mode_on_backend_config(packet_option: &mut Option<ScaiiPacket>) {
    if let &mut Some(ScaiiPacket {
        specific_msg:
            Some(SpecificMsg::Config(protos::Cfg {
                which_module:
                    Some(WhichModule::BackendCfg(protos::BackendCfg {
                        ref mut is_replay_mode,
                        ..
                    })),
            })),
        ..
    }) = packet_option
    {
        *is_replay_mode = true;
    }
}

pub fn get_replay_filenames() -> Result<Vec<String>, Box<Error>> {
    use std::fs;
    let mut result: Vec<String> = Vec::new();
    let replay_dir = scaii_core::get_default_replay_dir()?;
    let paths = fs::read_dir(replay_dir.to_str().unwrap().to_string()).unwrap();

    for path in paths {
        let filename = path.unwrap().file_name().to_str().unwrap().to_string();
        if filename.ends_with(".scr") {
            result.push(filename.clone());
            println!("Name: {}", filename);
        }
    }

    Ok(result)
}

// Delta(ActionWrapper),
// Keyframe(SerializationInfo, ActionWrapper),

pub fn get_keframe_indices(replay_data: &Vec<ReplayAction>) -> Vec<u32> {
    let mut result: Vec<u32> = Vec::new();
    let mut index: u32 = 0;
    for replay_action in replay_data {
        match replay_action {
            &ReplayAction::Delta(_) => {
                println!("....get_keyframe_indices saw delta");
            }
            &ReplayAction::Keyframe(_, _) => {
                println!("....get_keyframe_indices saw keyframe");
                if index == 0 {
                    result.push(index);
                } else {
                    // account for the fact that the first ser_response winds up being the first packet
                    // in effect pushing all later indices up one
                    result.push(index + 1);
                }
            }
            &ReplayAction::Header(_) => {
                println!("....get_keyframe_indices saw header");
            } // should not be in play, can ignore
        }
        index = index + 1;
    }
    result
}

pub fn get_keyframe_map(
    replay_data: &Vec<ReplayAction>,
) -> Result<BTreeMap<u32, ScaiiPacket>, Box<Error>> {
    use prost::Message;
    let mut result: BTreeMap<u32, ScaiiPacket> = BTreeMap::new();
    let mut count: u32 = 0;
    for replay_action in replay_data {
        match replay_action {
            &ReplayAction::Delta(_) => {}
            &ReplayAction::Keyframe(ref serialization_info, _) => {
                let ser_proto_ser_resp: SerializedProtosSerializationResponse =
                    serialization_info.data.clone();
                let ser_response_decode_result =
                    protos::SerializationResponse::decode(ser_proto_ser_resp.data);
                match ser_response_decode_result {
                    Ok(ser_response) => {
                        let spkt = pkt_util::wrap_response_in_scaii_pkt(ser_response);
                        if count == 0 {
                            result.insert(count, spkt);
                        } else {
                            // account for the fact that the first ser_response winds up being the first packet and
                            // it's action winds up being the second.
                            result.insert(count + 1, spkt);
                        }
                    }
                    Err(err) => {
                        return Err(Box::new(err));
                    }
                }
            }
            &ReplayAction::Header(_) => {}
        }
        count = count + 1;
    }
    Ok(result)
}

pub fn get_scaii_packets_for_replay_actions(
    replay_data: &Vec<ReplayAction>,
) -> Result<Vec<ScaiiPacket>, Box<Error>> {
    use prost::Message;
    let mut result: Vec<ScaiiPacket> = Vec::new();
    let mut stored_first_keyframe = false;
    for replay_action in replay_data {
        match replay_action {
            &ReplayAction::Delta(ref action_wrapper) => {
                let spkt = pkt_util::convert_action_wrapper_to_action_pkt(action_wrapper.clone())?;
                result.push(spkt);
            }
            &ReplayAction::Keyframe(ref serialization_info, ref action_wrapper) => {
                if !stored_first_keyframe {
                    let ser_proto_ser_resp: SerializedProtosSerializationResponse =
                        serialization_info.data.clone();
                    let ser_response_decode_result =
                        protos::SerializationResponse::decode(ser_proto_ser_resp.data);
                    match ser_response_decode_result {
                        Ok(ser_response) => {
                            let spkt = pkt_util::wrap_response_in_scaii_pkt(ser_response);
                            result.push(spkt);
                        }
                        Err(err) => {
                            return Err(Box::new(err));
                        }
                    }
                    stored_first_keyframe = true;
                }
                let spkt = pkt_util::convert_action_wrapper_to_action_pkt(action_wrapper.clone())?;
                result.push(spkt);
            }
            &ReplayAction::Header(_) => {}
        }
    }
    Ok(result)
}

#[derive(Debug, Deserialize)]
pub struct Args {
    pub cmd_webserver: bool,
    //
    pub cmd_test: bool,
    pub flag_data_from_recorded_file: bool,
    pub flag_data_hardcoded: bool,
    //
    pub cmd_file: bool,
    pub arg_path_to_replay_file: String,
}

pub fn parse_args(arguments: Vec<String>) -> Args {
    let mut args = Args {
        cmd_webserver: false,
        cmd_test: false,
        flag_data_from_recorded_file: false,
        flag_data_hardcoded: false,

        cmd_file: false,
        arg_path_to_replay_file: "".to_string(),
    };
    //      replay webserver
    //  replay file
    //  replay test [--data-hardcoded | --data-from-recorded-file]
    //  replay (-h | --help)
    if arguments.len() < 2 {
        println!("{}", USAGE);
        std::process::exit(0);
    }
    let command = &arguments[1];
    match command.as_ref() {
        "webserver" => {
            args.cmd_webserver = true;
        }
        "file" => {
            args.cmd_file = true;
            match arguments.len() {
                2 => {
                    // no further arguments
                }
                _ => {
                    println!("{}", USAGE);
                    std::process::exit(0);
                }
            }
        }
        "test" => {
            args.cmd_test = true;
            match arguments.len() {
                3 => {
                    let flag = &arguments[2];
                    match flag.as_ref() {
                        "--data-hardcoded" => {
                            args.flag_data_hardcoded = true;
                        }
                        "--data-from-recorded-file" => {
                            args.flag_data_from_recorded_file = true;
                        }
                        _ => {
                            println!("{}", USAGE);
                            std::process::exit(0);
                        }
                    }
                }
                _ => {
                    println!("{}", USAGE);
                    std::process::exit(0);
                }
            }
        }
        &_ => {
            println!("{}", USAGE);
            std::process::exit(0);
        }
    }
    args
}
