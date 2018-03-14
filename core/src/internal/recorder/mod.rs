#![allow(dead_code)]

use scaii_defs::protos;
use scaii_defs::{Module, Recorder};
use scaii_defs::protos::{ExplanationPoint, MultiMessage, RecorderConfig, RecorderStep, ScaiiPacket};
use scaii_defs::protos::scaii_packet::SpecificMsg;
use std::error::Error;
use std::fmt;
use std::path::PathBuf;
use std::fs;

use bincode::{serialize, Infinite};
use std::io::prelude::*;
use std::fs::File;
use prost::Message;
#[cfg(test)]
mod test;
mod test_util;

#[derive(Debug)]
struct RecorderError {
    details: String,
}

impl RecorderError {
    fn new(msg: &str) -> RecorderError {
        RecorderError {
            details: msg.to_string(),
        }
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
pub struct ActionWrapper {
    pub has_explanation: bool,
    pub step: u32,
    pub title: String,
    pub serialized_action: Vec<u8>,
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
pub enum ReplayAction {
    Header(ReplayHeader),
    Delta(ActionWrapper),
    Keyframe(SerializationInfo, ActionWrapper),
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
    pub fn new() -> Result<Self, Box<Error>> {
        let replay_dir_path_buf = get_default_replay_dir()?;
        ensure_dir_exists(&replay_dir_path_buf)?;
        let path_buf = get_default_replay_file_path()?;
        Ok(RecorderManager {
            staged_ser_info: None,
            file_path: Some(path_buf),
            replay: Vec::new(),
            is_recording: false,
            writable_file: None,
        })
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
        Ok(SerializedProtosEndpoint {
            data: endpoint_data,
        })
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
            Some(SpecificMsg::RecorderConfig(RecorderConfig {
                pkts: _,
                overwrite: ref ow,
                filepath: ref path,
            })) => {
                self.is_recording = true;
                println!("recorderConfig pkt : {:?}", pkt);
                let ser_protos_scaii_pkt = self.get_serialized_protos_scaii_packet(pkt)?;
                let replay_header = ReplayHeader {
                    configs: ser_protos_scaii_pkt,
                };
                let replay_action = ReplayAction::Header(replay_header);
                self.start_recording(path, ow, &replay_action)?;
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
                    let action_wrapper_result = get_action_wrapper_for_recorder_step(rec_step);
                    match action_wrapper_result {
                        Ok(action_wrapper) => {
                            if let Some(SerializationInfo { .. }) = self.staged_ser_info {
                                self.save_keyframe(action_wrapper)?;
                            } else {
                                let replay_action = ReplayAction::Delta(action_wrapper);
                                println!("...........persisting DELTA");
                                self.persist_replay_action(&replay_action)?;
                            }
                        }
                        Err(_) => {
                            println!("WARNING - skipping RecorderStep {:?}", rec_step);
                        }
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

    fn get_one_up_path(&mut self, filepath: &String) -> String {
        filepath.clone()
    }
    fn start_recording(
        &mut self,
        filepath_option: &Option<String>,
        overwrite: &bool,
        header_replay_action: &ReplayAction,
    ) -> Result<(), Box<Error>> {
        match filepath_option {
            &None => {}
            &Some(ref path) => {
                if *overwrite {
                    let pathbuf_option: Option<PathBuf> = Some(PathBuf::from(path));
                    self.file_path = pathbuf_option;
                } else {
                    let pathbuf_option: Option<PathBuf> =
                        Some(PathBuf::from(self.get_one_up_path(path)));
                    self.file_path = pathbuf_option;
                }
            }
        }
        if self.file_path == None {
            return Err(Box::new(RecorderError::new(
                "RecorderManager.file_path not specified prior to start of recording.",
            )));
        }
        let path = self.file_path.clone().unwrap();
        let f = File::create(&path).expect("could not write to replay file");
        self.writable_file = Some(f);
        println!("...........persisting HEADER {:?}", header_replay_action);
        self.persist_replay_action(header_replay_action)?;
        Ok(())
    }

    fn persist_replay_action(&mut self, replay_action: &ReplayAction) -> Result<(), Box<Error>> {
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

    fn save_keyframe(&mut self, action_wrapper: ActionWrapper) -> Result<(), Box<Error>> {
        let ser_info = self.staged_ser_info.clone();
        if ser_info == None {
            return Err(Box::new(RecorderError::new(
                "Cannot create keyFrame to store - ser_info missing.",
            )));
        }
        let replay_action = ReplayAction::Keyframe(ser_info.clone().unwrap(), action_wrapper);
        println!(".............persisting KEYFRAME");
        self.persist_replay_action(&replay_action)?;
        self.staged_ser_info = None;
        Ok(())
    }
}

impl Module for RecorderManager {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
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
    replay_dir_path_buf.push("replay.scr");
    Ok(replay_dir_path_buf)
}

pub fn get_default_replay_dir() -> Result<PathBuf, Box<Error>> {
    let mut dir = get_home_dir()?;
    dir.push(".scaii");
    dir.push("replays");
    ensure_dir_exists(&dir)?;
    Ok(dir)
}

fn get_home_dir() -> Result<PathBuf, Box<Error>> {
    use std::env;
    let result: Option<PathBuf> = env::home_dir();
    match result {
        Some(pathbuf) => Ok(pathbuf),
        None => Err(Box::new(RecorderError::new(
            "could not determine user's home directory",
        ))),
    }
}

fn ensure_dir_exists(path_buf: &PathBuf) -> Result<(), Box<Error>> {
    if !path_buf.as_path().exists() {
        fs::create_dir_all(path_buf.as_path())?;
    }
    Ok(())
}

fn is_dir_scaii_root(dir: &PathBuf) -> bool {
    let mut candidate_dir = dir.clone();
    candidate_dir.push("core");
    let core_dir_exists = candidate_dir.exists();

    let mut candidate_dir = dir.clone();
    candidate_dir.push("common_protos");
    let common_protos_dir_exists = candidate_dir.exists();

    core_dir_exists && common_protos_dir_exists
}

fn get_action_wrapper_for_recorder_step(
    rec_step: &RecorderStep,
) -> Result<ActionWrapper, Box<Error>> {
    match rec_step.action {
        Some(ref action) => {
            let action_data: Vec<u8> = get_serialized_action(action)?;
            match action.explanation_point {
                Some(ref expl) => {
                    println!("RECORDER: action has expl_point?  YES");
                    Ok(ActionWrapper {
                        has_explanation: true,
                        step: get_step_value(expl),
                        title: get_title_value(expl),
                        serialized_action: action_data,
                    })
                },
                None => {
                    println!("RECORDER: action has expl_point?  NO");
                    Ok(ActionWrapper {
                        has_explanation: false,
                        step: 0,
                        title: "".to_string(),
                        serialized_action: action_data,
                    })
                },
            }
        }
        None => Err(Box::new(RecorderError::new("no action in RecorderStep"))),
    }
}
fn get_title_value(explanation: &ExplanationPoint) -> String {
    match explanation.title {
        Some(ref title) => title.clone(),
        None => "".to_string(),
    }
}
fn get_step_value(explanation: &ExplanationPoint) -> u32 {
    match explanation.step {
        Some(ref step) => step.clone(),
        None => 0,
    }
}

fn get_serialized_action(action: &protos::Action) -> Result<Vec<u8>, Box<Error>> {
    let mut action_data: Vec<u8> = Vec::new();
    action.encode(&mut action_data)?;
    Ok(action_data)
}
