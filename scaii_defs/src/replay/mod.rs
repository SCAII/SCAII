use std::path::Path;
use std::fs::File;
use std::error::Error;

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

pub fn load_replay_file(path: &Path) -> Result<Vec<ReplayAction>, Box<Error>> {
    use bincode;
    use bincode::Infinite;
    use std::fs::File;
    use std::io::BufReader;

    let replay_file = File::open(path).expect("file not found");
    let mut replay_vec: Vec<ReplayAction> = Vec::new();
    let mut reader = BufReader::new(replay_file);

    while let Ok(action) =
        bincode::deserialize_from::<BufReader<File>, ReplayAction, Infinite>(&mut reader, Infinite)
    {
        replay_vec.push(action);
    }

    //print_replay_actions(&replay_actions);
    Ok(replay_vec)
}

pub fn save_replay<P: AsRef<Path>>(path: P, replay_actions: &[ReplayAction]) -> Result<(),Box<Error>>{
    let mut file = File::create(path)?;

    for action in replay_actions {
        persist_replay_action(&mut file, action)?;
    }

    Ok(())
}

fn persist_replay_action(file: &mut File, replay_action: &ReplayAction) -> Result<(), Box<Error>> {
    use bincode;
    use bincode::Infinite;
    use std::io::prelude::*;

    let encoded: Vec<u8> = bincode::serialize(replay_action, Infinite).unwrap();
    let data_size = encoded.len();
    let write_result = file.write(&encoded)?;

    assert_eq!(write_result, data_size);  

    Ok(())
}
