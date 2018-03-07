use scaii_core::{ActionWrapper, ReplayAction,
                 SerializedProtosSerializationResponse, SerializationInfo, SerializedProtosEndpoint};
use protos::{Action, ScaiiPacket, SerializationResponse};
use super::replay_sequencer::{ReplaySequencer, SequenceState};


#[test]
fn test_replay_sequencer() {
    let replay_actions = get_test_replay_actions();
    let rs_result = ReplaySequencer::new(replay_actions);
    match rs_result {
        Ok(mut rs) => {
            assert!(rs.get_sequence_length() == 11);  // add one for the first keyFrame
            assert!(rs.get_state() == SequenceState::NeedToSendFirstKeyFrame);
            assert!(rs.get_current_index()==0);
            assert!(rs.has_next());
            let _pkt = rs.next();
            assert!(rs.has_next());
            assert!(rs.get_state() == SequenceState::ReadyForNextStep);
            assert!(rs.get_current_index()==1);
            let _pkt = rs.next();
            assert!(rs.has_next());
            assert!(rs.get_state() == SequenceState::ReadyForNextStep);
            let _pkt = rs.next();
            assert!(rs.has_next());
            assert!(rs.get_state() == SequenceState::ReadyForNextStep);
            assert!(rs.get_current_index()==3);
            let _pkt = rs.next();
            assert!(rs.has_next());
            let _pkt = rs.next();
            assert!(rs.has_next());
            let _pkt = rs.next();
            assert!(rs.has_next());
            let _pkt = rs.next();
            assert!(rs.has_next());
            let _pkt = rs.next();
            assert!(rs.has_next());
            assert!(rs.get_state() == SequenceState::ReadyForNextStep);
            let _pkt = rs.next();
            assert!(rs.has_next());
            assert!(rs.get_current_index() == 9);
            let _pkt = rs.next();
            let _pkt = rs.next();
            let state = rs.get_state();
            assert!(state == SequenceState::Done);
            assert!(!rs.has_next());

            println!("JUMP TO 9");
            let jump_result = rs.jump_to(9);
            match jump_result {
                Ok(pkts) => {
                    if pkts.len() as u32 == 5 {
                        assert!(true);
                        assert!(is_ser_resp(&pkts[0]));
                        assert!(is_action(&pkts[1]));
                        assert!(is_action(&pkts[2]));
                        assert!(is_action(&pkts[3]));
                        assert!(is_action(&pkts[4]));
                    }
                    else {
                        println!("jump had wrong number of pkts - should have been 5 , was {}", pkts.len() as u32);
                        assert!(false);
                    }
                    assert!(rs.get_current_index() == 10);
                    assert!(rs.get_state() == SequenceState::ReadyForNextStep);
                }
                Err(err) => {
                    println!("jump problem {:?}", err);
                    assert!(false);
                }
            }
            
            println!("JUMP TO 5");
            let jump_result = rs.jump_to(5);
            match jump_result {
                Ok(pkts) => {
                    if pkts.len() as u32 == 4 {
                        assert!(true);
                        assert!(is_ser_resp(&pkts[0]));
                        assert!(is_action(&pkts[1]));
                        assert!(is_action(&pkts[2]));
                        assert!(is_action(&pkts[3]));
                    }
                    else {
                        println!("jump had wrong number of pkts - should have been 4 , was {}", pkts.len() as u32);
                        assert!(false);
                    }
                    assert!(rs.get_current_index() == 6);
                    assert!(rs.get_state() == SequenceState::ReadyForNextStep);
                }
                Err(err) => {
                    println!("jump problem {:?}", err);
                    assert!(false);
                }
            }
            
            println!("JUMP TO 4");
            let jump_result = rs.jump_to(4);
            match jump_result {
                Ok(pkts) => {
                    if pkts.len() as u32 == 3 {
                        assert!(true);
                        assert!(is_ser_resp(&pkts[0]));
                        assert!(is_action(&pkts[1]));
                        assert!(is_action(&pkts[2]));
                    }
                    else {
                        println!("jump had wrong number of pkts - should have been 3 , was {}", pkts.len() as u32);
                        assert!(false);
                    }
                    assert!(rs.get_current_index() == 5);
                    assert!(rs.get_state() == SequenceState::ReadyForNextStep);
                }
                Err(err) => {
                    println!("jump problem {:?}", err);
                    assert!(false);
                }
            }
            
            println!("JUMP TO LATER");
            let jump_result = rs.jump_to(7);
            match jump_result {
                Ok(pkts) => {
                    if pkts.len() as u32 == 3 {
                        assert!(true);
                        assert!(is_ser_resp(&pkts[0]));
                        assert!(is_action(&pkts[1]));
                        assert!(is_action(&pkts[2]));
                    }
                    else {
                        println!("jump had wrong number of pkts - should have been 3 , was {}", pkts.len() as u32);
                        assert!(false);
                    }
                    assert!(rs.get_current_index() == 8);
                    assert!(rs.get_state() == SequenceState::ReadyForNextStep);
                }
                Err(err) => {
                    println!("jump problem {:?}", err);
                    assert!(false);
                }
            }

            println!("JUMP TO END");
            let jump_result = rs.jump_to(10);
            match jump_result {
                Ok(pkts) => {
                    if pkts.len() as u32 == 6 {
                        assert!(true);
                        assert!(is_ser_resp(&pkts[0]));
                        assert!(is_action(&pkts[1]));
                        assert!(is_action(&pkts[2]));
                        assert!(is_action(&pkts[3]));
                        assert!(is_action(&pkts[4]));
                        assert!(is_action(&pkts[5]));
                    }
                    else {
                        println!("jump had wrong number of pkts - should have been 6 , was {}", pkts.len() as u32);
                        assert!(false);
                    }
                    assert!(rs.get_current_index() == 11);
                    assert!(rs.get_state() == SequenceState::Done);
                }
                Err(err) => {
                    println!("jump problem {:?}", err);
                    assert!(false);
                }
            }

            println!("JUMP TO BEGINNING");
            let jump_result = rs.jump_to(0);
            match jump_result {
                Ok(pkts) => {
                    if pkts.len() as u32 == 1 {
                        assert!(true);
                        assert!(is_ser_resp(&pkts[0]));
                    }
                    else {
                        println!("jump had wrong number of pkts - should have been 1 , was {}", pkts.len() as u32);
                        assert!(false);
                    }
                    assert!(rs.get_current_index() == 1);
                    assert!(rs.get_state() == SequenceState::ReadyForNextStep);
                }
                Err(err) => {
                    println!("jump problem {:?}", err);
                    assert!(false);
                }
            }

            println!("REWIND");
            // rewind to beginning
            let first_keyframe_pkt = rs.rewind();
            assert!(is_ser_resp(&first_keyframe_pkt));
            let state = rs.get_state();
            assert!(state == SequenceState::ReadyForNextStep);
            assert!(rs.get_current_index()==1);
        }
        Err(_err) => {
            assert!(false);
        }
    }
    
}
fn get_test_replay_actions() -> Vec<ReplayAction> {
    let mut result : Vec<ReplayAction> = Vec::new();
    result.push(get_empty_keyframe()); //0,1
    result.push(get_empty_action());//2
    result.push(get_empty_keyframe());//3
    result.push(get_empty_action());//4
    result.push(get_empty_action());//5
    result.push(get_empty_keyframe());//6
    result.push(get_empty_action());//7
    result.push(get_empty_action());//8
    result.push(get_empty_action());//9
    result.push(get_empty_action());//10
    result
}

fn get_empty_action_wrapper() -> ActionWrapper {
    let vec_dactions : Vec<i32> = Vec::new();
    let vec_cactions : Vec<f64> = Vec::new();
    let action = Action {
	    discrete_actions: vec_dactions,
	    continuous_actions: vec_cactions,
        alternate_actions: None,
        explanation: None,
    };
    let action_data: Vec<u8> = Vec::new();
    ActionWrapper {
        has_explanation: false,
        step: 0,
        title: "".to_string(),
        serialized_action: action_data,
    }
}

fn get_empty_action() -> ReplayAction {
    ReplayAction::Delta(get_empty_action_wrapper())
}
fn get_empty_keyframe() -> ReplayAction {
    ReplayAction::Keyframe(get_empty_ser_info(), get_empty_action_wrapper())
}
fn get_empty_ser_info() -> SerializationInfo {
    let ser_protos_ser_resp =
        get_serialized_protos_serialization_response();
    let endpoint_data: Vec<u8> = Vec::new();
    let src_ep_serialized = SerializedProtosEndpoint {
        data: endpoint_data,
    };
    SerializationInfo {
        source: src_ep_serialized,
        data: ser_protos_ser_resp,
    }
}

fn get_serialized_protos_serialization_response() -> SerializedProtosSerializationResponse {
    let ser_resp_data: Vec<u8> = Vec::new();
    SerializedProtosSerializationResponse {
        data: ser_resp_data,
    }
}

fn create_ser_resp() -> SerializationResponse {
    let mut ser_vec: Vec<u8> = Vec::new();
    ser_vec.push(7 as u8);
    ser_vec.push(8 as u8);
    ser_vec.push(9 as u8);
    SerializationResponse {
        serialized: ser_vec,
        format: 1 as i32,
    }
}

fn is_ser_resp(pkt: &ScaiiPacket) -> bool {
    use scaii_defs::protos::scaii_packet::SpecificMsg;
    let specific_msg = &pkt.specific_msg;
    match *specific_msg {
        Some(SpecificMsg::SerResp(_)) => true,
        _ => false,
    }
}

fn is_action(pkt: &ScaiiPacket) -> bool {
    use scaii_defs::protos::scaii_packet::SpecificMsg;
    let specific_msg = &pkt.specific_msg;
    match *specific_msg {
        Some(SpecificMsg::Action(_)) => true,
        _ => false,
    }
}