//use scaii_defs;
use scaii_defs::protos;
use scaii_defs::{Module, Recorder};
use scaii_defs::protos::{MultiMessage, RecorderStep, ScaiiPacket};
// ask Zoe why this won't work, when it works in  replay's main.rs     use protos::{MultiMessage, ScaiiPacket};
use scaii_defs::protos::scaii_packet::SpecificMsg;
use std::error::Error;
use std::fmt;

use bincode::{serialize, Infinite};
use std::io::prelude::*;
use std::fs::OpenOptions;
 use prost::Message;

#[cfg(test)]
mod test;

#[derive(Debug)]
struct RecorderError {
    details: String
}

impl RecorderError {
    fn new(msg: &str) -> RecorderError {
        RecorderError{details: msg.to_string()}
    }
}

impl fmt::Display for RecorderError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f,"{}",self.details)
    }
}

impl Error for RecorderError {
    fn description(&self) -> &str {
        &self.details
    }
}

//
//  The generated proto messages are not Serializable so we use Stunt versions for these actors
//

// to serialize protomessage
//   let mut buf: Vec<u8> = Vec::new();
//    packet.encode(&mut buf)?;



#[derive(Clone,Serialize, Deserialize, PartialEq, Debug)]
struct SerializedProtosSerializationResponse {
    data: Vec<u8>,
}
#[derive(Clone,Serialize, Deserialize, PartialEq, Debug)]
struct SerializedProtosAction {
    data: Vec<u8>,
}
#[derive(Clone,Serialize, Deserialize, PartialEq, Debug)]
struct SerializedProtosScaiiPacket {
    data: Vec<u8>,
}
#[derive(Clone,Serialize, Deserialize, PartialEq, Debug)]
struct SerializedProtosEndpoint {
    data: Vec<u8>,
}
#[derive(Clone,Serialize, Deserialize, PartialEq, Debug)]
enum GameAction {
     DecisionPoint(SerializedProtosAction),
     Step,
}

#[derive(Clone,Serialize, Deserialize, PartialEq, Debug)]
enum ReplayAction {
    Header(ReplayHeader),
    Delta(GameAction),
    Keyframe(SerializationInfo,GameAction),
}

#[derive(Clone,Serialize, Deserialize, PartialEq, Debug)]
struct SerializationInfo {
    source: SerializedProtosEndpoint,
    data: SerializedProtosSerializationResponse,
}

#[derive(Clone,Serialize, Deserialize, PartialEq, Debug)]
struct ReplayHeader {
    configs: Vec<SerializedProtosScaiiPacket>,
}

/// need this inside the environment (router) to collect messages
//struct RecorderMessageQueue {
    //incoming_messages: Vec<protos::ScaiiPacket>,
//}


struct RecorderManager {
    //incoming_message_queue:Rc<RefCell<RecorderMessageQueue>>, // going to go in router
    staged_ser_info: Option<SerializationInfo>,
    file_path: Option<String>,
    replay: Vec<ReplayAction>,
    replay_header: ReplayHeader,
}
impl RecorderManager  {
    pub fn new() -> Self {
        RecorderManager {
            staged_ser_info: None,
            file_path: None,
            replay : Vec::new(),
            replay_header: ReplayHeader { configs: Vec::new() },
        }
    }

    fn init(&mut self){
        self.file_path = Some(String::from("C:\\Users\\Jed Irvine\\exact\\SCAII\\core\\replay_data\\replay_data.txt"));
    }
   
    fn get_serialized_protos_action(&mut self, action: protos::Action) -> Result<SerializedProtosAction, Box<Error>> {
        let mut action_data: Vec<u8> = Vec::new();
        action.encode(&mut action_data)?;
        Ok(SerializedProtosAction {
            data: action_data
        })
    }

    fn get_serialized_protos_serialization_response(&mut self, ser_resp: protos::SerializationResponse) -> Result<SerializedProtosSerializationResponse, Box<Error>> {
        let mut ser_resp_data: Vec<u8> = Vec::new();
        ser_resp.encode(&mut ser_resp_data)?;
        Ok(SerializedProtosSerializationResponse { data: ser_resp_data })
    }

    fn get_serialized_protos_endpoint(&mut self, endpoint: protos::Endpoint) -> Result<SerializedProtosEndpoint, Box<Error>> {
        let mut endpoint_data: Vec<u8> = Vec::new();
        endpoint.encode(&mut endpoint_data)?;
        Ok(SerializedProtosEndpoint { data: endpoint_data })
    }

    fn get_serialized_protos_scaii_packet(&mut self, pkt: protos::ScaiiPacket) -> Result<SerializedProtosScaiiPacket, Box<Error>> {
        let mut pkt_data: Vec<u8> = Vec::new();
        pkt.encode(&mut pkt_data)?;
        Ok(SerializedProtosScaiiPacket { data: pkt_data })
    }

    fn handle_pkt(&mut self, pkt: ScaiiPacket) -> Result<(), Box<Error>>{
        let src_endpoint = pkt.src;
        let ser_protos_src_endpoint = self.get_serialized_protos_endpoint(src_endpoint)?;
        let specific_msg = pkt.specific_msg;
        match specific_msg {
            Some(SpecificMsg::SerResp(ser_resp)) => {
                let ser_protos_ser_resp = self.get_serialized_protos_serialization_response(ser_resp)?;
                let ser_info = SerializationInfo { source: ser_protos_src_endpoint, data: ser_protos_ser_resp };
                if let Some(SerializationInfo { source:_, data:_}) = self.staged_ser_info {
                    return Err(Box::new(RecorderError::new("Received consecutive SerializationInfo packets - expected RecorderStep in between.")));
                }
                self.staged_ser_info = Some(ser_info);
            },
            Some(SpecificMsg::RecorderStep(rec_step)) => {
                if let Some(SerializationInfo{source:_, data:_}) = self.staged_ser_info {
                    self.save_keyframe(rec_step)?;
                }
                else {
                    let game_action = self.get_game_action_for_protos_action(rec_step)?;
                    let replay_action = ReplayAction::Delta(game_action);
                    self.add_replay(replay_action);
                }  
            },
            // TODO HANDLE CONFIG MESSAGE And ADD TO HEADER
            _ => {},
        }
        Ok(())
    }

    fn add_replay(&mut self, replay_action: ReplayAction) {
        if self.replay.len() == 0 {
            // the config messages are done by now , so add them first
            let header_replay_action = ReplayAction::Header(self.replay_header.clone());
            self.replay.push(header_replay_action);
        }
        self.replay.push(replay_action);
    }
    fn get_game_action_for_protos_action(&mut self, rec_step: RecorderStep) -> Result<GameAction, Box<Error>> {
        if rec_step.is_decision_point {
            if rec_step.action == None {
                    return Err(Box::new(RecorderError::new("Malformed RecordStep: no action present but is_decision_point was true.")));
            }
            let serialized_protos_action = self.get_serialized_protos_action(rec_step.action.unwrap())?;
            Ok(GameAction::DecisionPoint(serialized_protos_action))
        }
        else {
            Ok(GameAction::Step)
        }
    }
    fn save_keyframe(&mut self, rec_step: RecorderStep) ->  Result<(), Box<Error>> {
        if rec_step.action == None {
            return Err(Box::new(RecorderError::new("Cannot create keyFrame to store - action missing.")));
        }
        let game_action = self.get_game_action_for_protos_action(rec_step)?;
        let ser_info = self.staged_ser_info.clone();
        if ser_info == None{
            return Err(Box::new(RecorderError::new("Cannot create keyFrame to store - ser_info missing.")));
        }
        let replay_action = ReplayAction::Keyframe(ser_info.clone().unwrap(), game_action);
        self.add_replay(replay_action);
        self.staged_ser_info = None;
        //self.persist_replay_action(replay_action);
        Ok(())
    }
    fn persist(&mut self) -> Result<(), Box<Error>>{
        println!("persisting replay data...");
        let encoded: Vec<u8> = serialize(&self.replay, Infinite).unwrap();
        let data_size = encoded.len();
        if self.file_path == None {
            return Err(Box::new(RecorderError::new("RecorderManager.file_path not specifiedprior to calling persist.")));
        } 
        let path = self.file_path.clone().unwrap();  
        println!("trying to write to file {}", path);     
        let mut f = OpenOptions::new().write(true).open(&path[..]).expect("could not write to replay file");
        //let mut f = OpenOptions::new().write(true).open(&self.file_path.clone().unwrap()[..]).expect("could not write to replay file");

        let write_result = f.write(&encoded);
        if write_result.unwrap() != data_size {
             return Err(Box::new(RecorderError::new("could not write entire replay_action to replay file.")));
        }
        Ok(())
    }
    fn accept_config_message(&mut self, pkt: ScaiiPacket) -> Result<(), Box<Error>> {
       // queue up config messages for putting in header
       // which will happen when first gameStep arrives.
        let ser_protos_scaii_pkt = self.get_serialized_protos_scaii_packet(pkt)?;
        self.replay_header.configs.push(ser_protos_scaii_pkt);
        Ok(())
    }
}
impl Module for RecorderManager  {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>>{
         self.handle_pkt(msg.clone())
    }

    /// return empty messages
    fn get_messages(&mut self) -> MultiMessage{
        let pkts: Vec<ScaiiPacket> = Vec::new();
        MultiMessage { packets: pkts }
    }
}

impl Recorder for RecorderManager {}

