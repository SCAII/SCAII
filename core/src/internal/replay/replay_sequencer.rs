use scaii_core::ReplayAction;
use protos::ScaiiPacket;
use super::replay_util;
use std::collections::BTreeMap;
use std::error::Error;

#[derive(Clone, PartialEq)]
pub enum SequenceState {
    NeedToSendFirstKeyFrame,
    ReadyForNextStep,
    Done,
}

pub struct ReplaySequencer {
    index : u32,
    scaii_pkts: Vec<ScaiiPacket>,
    keyframe_indices: Vec<u32>,
    keyframe_map : BTreeMap<u32, ScaiiPacket>,
}

impl ReplaySequencer {
    pub fn new(replay_info: Vec<ReplayAction>) -> Result<ReplaySequencer, Box<Error>> {
        let keyframe_indices : Vec<u32> = replay_util::get_keframe_indices(&replay_info);
        println!("keyframe_indices : {:?}", keyframe_indices);
        let scaii_pkts : Vec<ScaiiPacket> = replay_util::get_scaii_packets_for_replay_actions(&replay_info)?;
        let keyframe_map =  replay_util::get_keyframe_map(replay_info)?;
        
        Ok(ReplaySequencer {
            index : 0,
            scaii_pkts: scaii_pkts,
            keyframe_indices: keyframe_indices,
            keyframe_map : keyframe_map,
        })
    }
    pub fn get_sequence_length(&mut self) -> u32 {
        println!("len is {}", self.scaii_pkts.len());
        self.scaii_pkts.len() as u32
    }
    pub fn get_state(&mut self) -> SequenceState {
        if self.index == 0 {
            SequenceState::NeedToSendFirstKeyFrame
        }
        else if self.index == self.scaii_pkts.len() as u32 {
            SequenceState::Done
        }
        else {
            SequenceState::ReadyForNextStep
        }
    }
    pub fn has_next(&mut self) -> bool {
        self.index < self.scaii_pkts.len() as u32
    }
    pub fn get_current_index(&mut self) -> u32 {
        self.index
    }
    pub fn next(&mut self) -> ScaiiPacket {
        if self.index == 0 {
            self.index = 1;
            println!("next returns pkt at index 0");
            self.scaii_pkts[0].clone()
        }
        else {
            println!("next returns pkt at index {}", self.index);
            let result = self.scaii_pkts[self.index as usize].clone();
            self.index = self.index + 1;
            println!("self.index now {}", self.index);
            result
        }
        
    }
    pub fn rewind(&mut self) -> ScaiiPacket{
        let zero_index : u32 = 0;
        let key_frame_pkt = self.keyframe_map.get(&zero_index).unwrap().clone();
        self.index = 1;
        key_frame_pkt
    }
    pub fn jump_to(&mut self, target : u32) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        use super::ReplayError;
        let mut result : Vec<ScaiiPacket> = Vec::new();
        let prior_keyframe_index = self.get_prior_key_frame_index(target);
        println!("prior_keyframe_index : {}", prior_keyframe_index);
        if !self.keyframe_map.contains_key(&prior_keyframe_index){
            return Err(Box::new(ReplayError::new(&format!("no prior keyframe at index {}", prior_keyframe_index))))
        }
        let key_frame_pkt = self.keyframe_map.get(&prior_keyframe_index).unwrap();
        result.push(key_frame_pkt.clone());

        println!("pushed keyframe ...");
        let mut cur_position: u32 = prior_keyframe_index;
        if prior_keyframe_index == 0 {
            // don't send the first action packet if we hopped to the beginning
            //as the first Keyframe has its own position in the list - 
            // we just want to send it.
        }
        else {
            while cur_position <= target {
                let spkt = self.scaii_pkts[cur_position as usize].clone();
                println!("pushed action ...");
                result.push(spkt);
                cur_position = cur_position + 1;
                println!("...cur_position now {:?}", cur_position);
            }
        }
        
        let index_after_fast_forward = target + 1;
        self.index = index_after_fast_forward;
        println!("self.index is now {}", self.index);
        Ok(result)
    }
    fn get_prior_key_frame_index(&mut self, starting_point : u32) -> u32 {
        let mut cur_index = self.keyframe_indices.len() as u32;
        println!("starting point is {}", starting_point);
        println!("seeking backwards from cur_index {}", cur_index);
        while cur_index >= 1 {
            cur_index = cur_index - 1;
            println!("cur_index now {}", cur_index);
            let value = self.keyframe_indices[cur_index as usize].clone();
            println!("value found is {}", value);
            if value < starting_point {
                println!("returning {}", value);
                return value;
            }
        }
        0
    }
}