use scaii_core::ReplayAction;
use protos::ScaiiPacket;
use super::replay_util;
use std::collections::BTreeMap;
use std::error::Error;

#[derive(Clone, PartialEq)]
#[allow(dead_code)] // for tests
pub enum SequenceState {
    NeedToSendFirstKeyFrame,
    ReadyForNextStep,
    Done,
}

pub struct ReplaySequencer {
    index: u32,
    scaii_pkts: Vec<ScaiiPacket>,
    keyframe_indices: Vec<u32>,
    keyframe_map: BTreeMap<u32, ScaiiPacket>,
    mode_transition_index: Option<u32>,
    rewound_to: u32,
}

enum PacketRetrievalModeForJump {
    SimpleMode,
    PrependKeyframeMode,
}
//
//  Keframe purposes:
//    first keyframe - always sent at start of game to initialize state
//    2nd through nth keyframe - only sent if the user navigates to an index later
//    than or equal to the index associated wiht that keyframe.(to re-initialize the state)
//
//
//  ReplaySequencer will serve out packets in one of two ways:
//
//  SIMPLE_MODE is where a jump to a target index is prior to the second keyframe.
//  Then (since the first keyframe occupies a position the scaii_pkts list) the packets that
//  be returned will be:
//   1. the first keyframe  (pulled from scaii_pkts[0] )
//   2. the action that was tied to that first keyframe in the recorded file (pulled from scaii_pkts[1] )
//   3.  any later actions up to and including the target index
//   so in SIMPLE_MODE, the number of packets returned will be == target -x + 1 (but with x always == 0),
//   so really just target + 1
//
//   SIMPLE_MODE is used when the game plays through the first time, or after the user
//   pauses at any point.
//
//   PREPEND_KEYFRAME_MODE is where a jump target is at or after the index associated with the
//   second keyframe.  In this case the packets returned will be:
//    1. The keyframe ASSOCIATED WITH index x (but not stored in scaii_pkts), the closest prior
//       keyframe to the target (pulled from keyframe_map.get(x))
//    2. The action at index x in scaii_pkts
//    3. any later actions up to and including the target index
//   so in PREPEND_KEYFRAME_MODE, the number of packets returned will be == target - x + 2
//
//   So, for a jump, we have different logic for each mode
//
#[allow(unused_assignments)]
impl ReplaySequencer {
    pub fn new(
        replay_info: &Vec<ReplayAction>,
        is_dummy: bool,
    ) -> Result<ReplaySequencer, Box<Error>> {
        use super::ReplayError;
        if is_dummy {
            let map: BTreeMap<u32, ScaiiPacket> = BTreeMap::new();
            Ok(ReplaySequencer {
                index: 0,
                scaii_pkts: Vec::new(),
                keyframe_indices: Vec::new(),
                keyframe_map: map,
                mode_transition_index: None,
                rewound_to: 0,
            })
        } else {
            let keyframe_indices: Vec<u32> = replay_util::get_keframe_indices(replay_info);
            let mut mode_transition_index: Option<u32> = Option::None;
            if keyframe_indices.len() == 0 {
                // can't function without keyframes!
                return Err(Box::new(ReplayError::new(
                    "No keyframes present in recorded file",
                )));
            } else if keyframe_indices.len() == 1 {
                // no second keyframe means that packets will be read out in SIMPLE_MODE
                // no matter where the jump target
                println!(" mode_transition_index will be None");
                mode_transition_index = None;
            } else {
                // there is a second keyframe so jumps to and after there will use PREPEND_KEYFRAME_MODE
                println!(" mode_transition_index will be {}", keyframe_indices[1]);
                mode_transition_index = Some(keyframe_indices[1]);
            }
            println!("keyframe_indices : {:?}", keyframe_indices);
            let scaii_pkts: Vec<ScaiiPacket> =
                replay_util::get_scaii_packets_for_replay_actions(replay_info)?;
            let keyframe_map = replay_util::get_keyframe_map(replay_info)?;

            Ok(ReplaySequencer {
                index: 0,
                scaii_pkts: scaii_pkts,
                keyframe_indices: keyframe_indices,
                keyframe_map: keyframe_map,
                mode_transition_index: mode_transition_index,
                rewound_to: 0,
            })
        }
    }

    pub fn print_length(&mut self) {
        println!("sequence length is {}", self.scaii_pkts.len());
    }
    #[allow(dead_code)] // for tests
    pub fn get_sequence_length(&mut self) -> u32 {
        println!("len is {}", self.scaii_pkts.len());
        self.scaii_pkts.len() as u32
    }

    #[allow(dead_code)] // for tests
    pub fn get_state(&mut self) -> SequenceState {
        if self.index == 0 {
            SequenceState::NeedToSendFirstKeyFrame
        } else if self.index == self.scaii_pkts.len() as u32 {
            SequenceState::Done
        } else {
            SequenceState::ReadyForNextStep
        }
    }

    pub fn has_next(&mut self) -> bool {
        self.index < self.scaii_pkts.len() as u32
    }

    #[allow(dead_code)] // for tests
    pub fn get_current_index(&mut self) -> u32 {
        self.index
    }

    pub fn next(&mut self) -> ScaiiPacket {
        if self.index == 0 {
            self.index = 1;
            println!("next returns pkt at index 0");
            self.scaii_pkts[0].clone()
        } else {
            println!("next returns pkt at index {}", self.index);
            let result = self.scaii_pkts[self.index as usize].clone();
            self.index = self.index + 1;
            println!("self.index now {}", self.index);
            result
        }
    }

    #[allow(dead_code)]
    pub fn get_index_rewound_to(&mut self) -> u32 {
        self.rewound_to.clone()
    }

    pub fn rewind(&mut self) -> ScaiiPacket {
        let zero_index: u32 = 0;
        let key_frame_pkt = self.keyframe_map.get(&zero_index).unwrap().clone();
        self.index = 1;
        key_frame_pkt
    }

    pub fn jump_to(&mut self, target: u32) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        use super::ReplayError;
        let prior_keyframe_index: u32 = self.get_prior_key_frame_index(target);
        println!("prior_keyframe_index : {}", prior_keyframe_index);
        if !self.keyframe_map.contains_key(&prior_keyframe_index) {
            return Err(Box::new(ReplayError::new(&format!(
                "no prior keyframe at index {}",
                prior_keyframe_index
            ))));
        }
        self.rewound_to = prior_keyframe_index.clone();
        let mut packet_retrieval_mode = PacketRetrievalModeForJump::SimpleMode;
        match self.mode_transition_index {
            None => {
                // packet_retrieval_mode stays at SimpleMode
                println!("PacketRetrievalModeForJump is SimpleMode");
            }
            Some(ref mode_transition_index) => {
                if prior_keyframe_index >= *mode_transition_index {
                    packet_retrieval_mode = PacketRetrievalModeForJump::PrependKeyframeMode;
                    println!("PacketRetrievalModeForJump is PrependKeyframeMode");
                } else {
                    println!("PacketRetrievalModeForJump is SimpleMode");
                }
            }
        }
        match packet_retrieval_mode {
            PacketRetrievalModeForJump::SimpleMode => {
                self.ff_simple_mode(prior_keyframe_index, target)
            }
            PacketRetrievalModeForJump::PrependKeyframeMode => {
                self.ff_prepend_mode(prior_keyframe_index, target)
            }
        }
    }

    pub fn ff_simple_mode(
        &mut self,
        prior_keyframe_index: u32,
        target: u32,
    ) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let mut result: Vec<ScaiiPacket> = Vec::new();
        let mut index = prior_keyframe_index;
        while index <= target {
            let spkt = self.scaii_pkts[index as usize].clone();
            if index == 0 {
                println!("   ...replay_sequencer pushed keyframe at index 0");
            } else {
                println!("   ...replay_sequencer pushed action at index {}", index);
            }
            result.push(spkt);
            index = index + 1;
            println!("   ...incr index to {:?} (after push)", index);
        }
        self.index = index;
        println!("   ...replay_sequencer.index is now {}", self.index);
        Ok(result)
    }

    pub fn ff_prepend_mode(
        &mut self,
        prior_keyframe_index: u32,
        target: u32,
    ) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let mut result: Vec<ScaiiPacket> = Vec::new();
        let key_frame_pkt = self.keyframe_map
            .get(&prior_keyframe_index)
            .unwrap()
            .clone();
        result.push(key_frame_pkt.clone());
        println!("   ...pushed keyframe at index {}", prior_keyframe_index);
        let mut action_pkts: Vec<ScaiiPacket> = self.ff_simple_mode(prior_keyframe_index, target)?;
        result.append(&mut action_pkts);
        Ok(result)
    }

    pub fn get_prior_key_frame_index(&mut self, starting_point: u32) -> u32 {
        let mut cur_index = self.keyframe_indices.len() as u32;
        println!("finding keyframe index prior to {}", starting_point);
        println!(
            "-look backward through the list of keframe indices starting at {}",
            cur_index
        );
        while cur_index >= 1 {
            cur_index = cur_index - 1;
            println!("position in keyframe index list is {}", cur_index);
            let value = self.keyframe_indices[cur_index as usize].clone();
            println!("index of keyframe listed here is {}", value);
            if value <= starting_point {
                println!(
                    "determined that {} is the index prior to {}",
                    value, starting_point
                );
                return value;
            }
        }
        0
    }
}
