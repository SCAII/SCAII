#![allow(dead_code)]


use scaii_defs::protos;
use scaii_defs::{Module, Recorder};
use scaii_defs::protos::{MultiMessage, RecorderStep, ScaiiPacket};
use scaii_defs::protos::scaii_packet::SpecificMsg;
use std::error::Error;
use std::fmt;
use std::path::PathBuf;
use std::fs;

use bincode::{serialize, Infinite};
use std::io::prelude::*;
use std::fs::File;
use prost::Message;
use util;

#[cfg(test)]
mod test;

#[derive(Debug)]
struct RecorderError {
    details: String,
}

impl RecorderError {
    fn new(msg: &str) -> RecorderError {
        RecorderError { details: msg.to_string() }
    }
}

impl fmt::Display for RecorderError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.details)
    }
}

impl Error for RecorderError {
    fn description(&self) -> &str {
        &self.details
    }
}

//
// wrapper structs for serialized proto messages
//

#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
pub struct SerializedProtosSerializationResponse {
    pub data: Vec<u8>,
}
#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
pub struct SerializedProtosAction {
    pub data: Vec<u8>,
}
#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
pub struct SerializedProtosScaiiPacket {
    pub data: Vec<u8>,
}
#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
pub struct SerializedProtosEndpoint {
    pub data: Vec<u8>,
}

//
//  structs supporting ReplayAction
//

#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
pub enum GameAction {
    DecisionPoint(SerializedProtosAction),
    Step,
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
pub enum ReplayAction {
    Header(ReplayHeader),
    Delta(GameAction),
    Keyframe(SerializationInfo, GameAction),
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
pub struct SerializationInfo {
    pub source: SerializedProtosEndpoint,
    pub data: SerializedProtosSerializationResponse,
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
pub struct ReplayHeader {
    pub configs: SerializedProtosScaiiPacket,
}

//
// RecorderManager manages recording
//

pub struct RecorderManager {
    staged_ser_info: Option<SerializationInfo>,
    file_path: Option<PathBuf>,
    replay: Vec<ReplayAction>,
    is_recording: bool,
    writable_file: Option<File>,
}
impl RecorderManager {
    pub fn new() -> Self {
        RecorderManager {
            staged_ser_info: None,
            file_path: None,
            replay: Vec::new(),
            is_recording: false,
            writable_file: None,
        }
    }

    fn init(&mut self) -> Result<(), Box<Error>> {
        let replay_dir_path_buf = get_default_replay_dir()?;
        ensure_dir_exists(&replay_dir_path_buf)?;
        let path_buf = get_default_replay_file_path()?;
        self.file_path = Some(path_buf);
        Ok(())
    }



    fn get_serialized_protos_action(
        &mut self,
        action: &protos::Action,
    ) -> Result<SerializedProtosAction, Box<Error>> {
        let mut action_data: Vec<u8> = Vec::new();
        action.encode(&mut action_data)?;
        Ok(SerializedProtosAction { data: action_data })
    }

    fn get_serialized_protos_serialization_response(
        &mut self,
        ser_resp: &protos::SerializationResponse,
    ) -> Result<SerializedProtosSerializationResponse, Box<Error>> {
        let mut ser_resp_data: Vec<u8> = Vec::new();
        ser_resp.encode(&mut ser_resp_data)?;
        Ok(SerializedProtosSerializationResponse {
            data: ser_resp_data,
        })
    }

    fn get_serialized_protos_endpoint(
        &mut self,
        endpoint: &protos::Endpoint,
    ) -> Result<SerializedProtosEndpoint, Box<Error>> {
        let mut endpoint_data: Vec<u8> = Vec::new();
        endpoint.encode(&mut endpoint_data)?;
        Ok(SerializedProtosEndpoint { data: endpoint_data })
    }

    fn get_serialized_protos_scaii_packet(
        &mut self,
        pkt: &protos::ScaiiPacket,
    ) -> Result<SerializedProtosScaiiPacket, Box<Error>> {
        let mut pkt_data: Vec<u8> = Vec::new();
        pkt.encode(&mut pkt_data)?;
        Ok(SerializedProtosScaiiPacket { data: pkt_data })
    }

    fn handle_pkt(&mut self, pkt: &ScaiiPacket) -> Result<(), Box<Error>> {
        let src_endpoint = &pkt.src;
        let ser_protos_src_endpoint = self.get_serialized_protos_endpoint(src_endpoint)?;
        let specific_msg = &pkt.specific_msg;
        match *specific_msg {
            Some(SpecificMsg::RecorderConfig(_)) => {
                self.is_recording = true;
                let ser_protos_scaii_pkt = self.get_serialized_protos_scaii_packet(pkt)?;
                let replay_header = ReplayHeader { configs: ser_protos_scaii_pkt };
                let replay_action = ReplayAction::Header(replay_header);
                self.start_recording(&replay_action)?;
            }
            Some(SpecificMsg::SerResp(ref ser_resp)) => {
                if self.is_recording {
                    let ser_protos_ser_resp =
                        self.get_serialized_protos_serialization_response(ser_resp)?;
                    let ser_info = SerializationInfo {
                        source: ser_protos_src_endpoint,
                        data: ser_protos_ser_resp,
                    };
                    if let Some(SerializationInfo { .. }) = self.staged_ser_info {
                        return Err(Box::new(RecorderError::new(
                            "Received consecutive SerializationInfo packets - expected RecorderStep in between.",
                        )));
                    }
                    self.staged_ser_info = Some(ser_info);
                }
            }
            Some(SpecificMsg::RecorderStep(ref rec_step)) => {
                if self.is_recording {
                    if let Some(SerializationInfo { .. }) = self.staged_ser_info {
                        self.save_keyframe(rec_step)?;
                    } else {
                        let game_action = self.get_game_action_for_protos_action(rec_step)?;
                        let replay_action = ReplayAction::Delta(game_action);
                        self.persist_replay_action(&replay_action)?;
                    }
                }
            }
            Some(SpecificMsg::GameComplete(_)) => {
                self.stop_recording();
            }
            _ => {}
        }
        Ok(())
    }

    fn stop_recording(&mut self) {
        self.writable_file = None;
    }

    fn start_recording(&mut self, header_replay_action: &ReplayAction) -> Result<(), Box<Error>> {
        println!("recording header.");
        if self.file_path == None {
            return Err(Box::new(RecorderError::new(
                "RecorderManager.file_path not specified prior to start of recording.",
            )));
        }
        let path = self.file_path.clone().unwrap();
        let f = File::create(&path).expect("could not write to replay file");
        self.writable_file = Some(f);
        self.persist_replay_action(header_replay_action)?;
        Ok(())
    }

    fn persist_replay_action(&mut self, replay_action: &ReplayAction) -> Result<(), Box<Error>> {
        println!("persisting replayAction {:?}", replay_action);
        match self.writable_file {
            None => {
                return Err(Box::new(RecorderError::new(
                    "RecorderManager.writable_file not open for recording replay action.",
                )));
            }
            Some(ref mut file) => {
                let encoded: Vec<u8> = serialize(replay_action, Infinite).unwrap();
                let data_size = encoded.len();
                let write_result = file.write(&encoded);
                if write_result.unwrap() != data_size {
                    return Err(Box::new(RecorderError::new(
                        "could not write entire replay_action to replay file.",
                    )));
                }
            }
        }
        Ok(())
    }

    fn get_game_action_for_protos_action(
        &mut self,
        rec_step: &RecorderStep,
    ) -> Result<GameAction, Box<Error>> {
        if rec_step.is_decision_point {
            if rec_step.action == None {
                return Err(Box::new(RecorderError::new(
                    "Malformed RecordStep: no action present but is_decision_point was true.",
                )));
            }
            let serialized_protos_action = self.get_serialized_protos_action(
                &rec_step.action.clone().unwrap(),
            )?;
            Ok(GameAction::DecisionPoint(serialized_protos_action))
        } else {
            Ok(GameAction::Step)
        }
    }

    fn save_keyframe(&mut self, rec_step: &RecorderStep) -> Result<(), Box<Error>> {
        if rec_step.action == None {
            return Err(Box::new(RecorderError::new(
                "Cannot create keyFrame to store - action missing.",
            )));
        }
        let game_action = self.get_game_action_for_protos_action(rec_step)?;
        let ser_info = self.staged_ser_info.clone();
        if ser_info == None {
            return Err(Box::new(RecorderError::new(
                "Cannot create keyFrame to store - ser_info missing.",
            )));
        }
        let replay_action = ReplayAction::Keyframe(ser_info.clone().unwrap(), game_action);
        self.persist_replay_action(&replay_action)?;
        self.staged_ser_info = None;
        Ok(())
    }
}

impl Module for RecorderManager {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        println!("recorderManager handling packet");
        self.handle_pkt(msg)
    }

    /// return empty messages
    fn get_messages(&mut self) -> MultiMessage {
        let pkts: Vec<ScaiiPacket> = Vec::new();
        MultiMessage { packets: pkts }
    }
}

impl Recorder for RecorderManager {}

pub fn get_default_replay_file_path() -> Result<PathBuf, Box<Error>> {
    let mut replay_dir_path_buf = get_default_replay_dir()?;
    replay_dir_path_buf.push("replay_data.sky");
    Ok(replay_dir_path_buf)
}

pub fn get_default_replay_dir() -> Result<PathBuf, Box<Error>> {
    let mut scaii_root = util::get_scaii_root()?;
    scaii_root.push("core");
    scaii_root.push("replay_data");
    Ok(scaii_root)
}

fn ensure_dir_exists(path_buf: &PathBuf) -> Result<(), Box<Error>> {
    if !path_buf.as_path().exists() {
        fs::create_dir_all(path_buf.as_path())?;
    }
    Ok(())
}
