use super::*;
use super::super::super::Environment;
use scaii_defs::protos;
use scaii_defs::{Agent, Backend, BackendSupported, Module, SerializationStyle};
use scaii_defs::protos::{scaii_packet, AgentCfg, AgentEndpoint, cfg, Cfg, GameComplete,
                         MultiMessage, ScaiiPacket, BackendEndpoint, RecorderConfig,
                         RecorderEndpoint, SerializationResponse};
use scaii_defs::protos::endpoint::Endpoint;
use scaii_defs::protos::scaii_packet::SpecificMsg;
use std::error::Error;
use std::rc::Rc;
use std::cell::RefCell;
use std::path::Path;
use std::fs::File;
use bincode::{ErrorKind, deserialize_from, Infinite};
use std::io::BufReader;


struct RecorderTesterMessageQueue {
    incoming_messages: Vec<protos::ScaiiPacket>,
}

impl Module for RecorderTesterMessageQueue {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        self.incoming_messages.push(msg.clone());
        Ok(())
    }

    /// return empty messages
    fn get_messages(&mut self) -> MultiMessage {
        let pkts: Vec<ScaiiPacket> = Vec::new();
        MultiMessage { packets: pkts }
    }
}



struct RecorderTester {
    incoming_message_queue: Rc<RefCell<RecorderTesterMessageQueue>>,
    env: Environment,
}
impl Agent for RecorderTesterMessageQueue {}


impl RecorderTester {
    fn run(&mut self, env: Environment) -> Result<(), Box<Error>> {
        self.env = env;
        let step_count: u32 = 2;

        self.configure_and_register_mock_rts(step_count);
        let mut recorder_manager = RecorderManager::new();
        let _result = recorder_manager.init()?;

        let rc_recorder_manager = Rc::new(RefCell::new(recorder_manager));
        {
            self.env.router_mut().register_recorder(
                Box::new(rc_recorder_manager.clone()),
            );
            debug_assert!(self.env.router().recorder().is_some());
        }
        let cfg_pkt = self.create_cfg_pkt();
        let _result = self.send_packet(cfg_pkt)?;
        let total: u32 = step_count * 4;
        for i in 0..total {
            println!("sending send_test_mode_step_hint_message {}", i);
            let _pkts: Vec<ScaiiPacket> = self.send_test_mode_step_hint_message()?;
        }
        let complete_message = self.create_game_complete_packet();
        self.send_packet(complete_message)?;
        let path_buf = get_default_replay_file_path()?;
        let path = path_buf.as_path();
        verify_persisted_file(&path)?;
        Ok(())
    }

    fn create_game_complete_packet(&mut self) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint { endpoint: Some(Endpoint::Backend(BackendEndpoint {})) },
            dest: protos::Endpoint { endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})) },
            specific_msg: Some(scaii_packet::SpecificMsg::GameComplete(GameComplete {})),
        }
    }

    fn create_test_control_message(&mut self, args_list: Vec<String>) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint { endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})) },
            dest: protos::Endpoint { endpoint: Some(Endpoint::Backend(BackendEndpoint {})) },
            specific_msg: Some(SpecificMsg::TestControl(
                protos::TestControl { args: args_list },
            )),
        }
    }
    fn send_test_mode_step_hint_message(&mut self) -> Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        let target: String = String::from("MockRts");
        let command: String = String::from("step");
        let mut args_list: Vec<String> = Vec::new();
        args_list.push(target);
        args_list.push(command);
        let pkt: ScaiiPacket = self.create_test_control_message(args_list);
        self.send_packet(pkt)
    }


    fn send_packet(&mut self, pkt: ScaiiPacket) -> Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        let mut pkts: Vec<ScaiiPacket> = Vec::new();
        pkts.push(pkt);
        let mm = MultiMessage { packets: pkts };
        let scaii_pkts = self.send_multimessage(mm)?;
        Ok(scaii_pkts)
    }
    fn send_multimessage(
        &mut self,
        mm: MultiMessage,
    ) -> Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        self.env.route_messages(&mm);
        self.env.update();
        let scaii_pkts: Vec<protos::ScaiiPacket> = {
            let queue = &mut *self.incoming_message_queue.borrow_mut();
            let result: Vec<protos::ScaiiPacket> = queue.incoming_messages.drain(..).collect();
            result
        };
        Ok(scaii_pkts)
    }

    fn create_cfg_pkt(&mut self) -> ScaiiPacket {
        let mut vec: Vec<ScaiiPacket> = Vec::new();
        let cfg = Cfg {
            which_module: Some(cfg::WhichModule::AgentCfg(
                AgentCfg { cfg_msg: Some(Vec::new()) },
            )),
        };
        let cfg_packet = ScaiiPacket {
            src: protos::Endpoint { endpoint: Some(Endpoint::Agent(AgentEndpoint {})) },
            dest: protos::Endpoint { endpoint: Some(Endpoint::Backend(BackendEndpoint {})) },
            specific_msg: Some(scaii_packet::SpecificMsg::Config(cfg)),
        };
        vec.push(cfg_packet);
        ScaiiPacket {
            src: protos::Endpoint { endpoint: Some(Endpoint::Agent(AgentEndpoint {})) },
            dest: protos::Endpoint { endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})) },
            specific_msg: Some(scaii_packet::SpecificMsg::RecorderConfig(
                RecorderConfig { pkts: vec },
            )),
        }
    }

    fn configure_and_register_mock_rts(&mut self, count: u32) {
        let mut rts = MockRts {
            recorder_steps: Vec::new(),
            outbound_messages: Vec::new(),
            step_position: 0,
            iteration_count: count,
            step_count: 0,
        };
        rts.init();
        {
            self.env.router_mut().register_backend(Box::new(rts));
        }
    }
}


#[test]
fn test_recorder() {
    use super::super::super::Environment;
    let environment_unused: Environment = Environment::new();
    let recorder_tester_message_queue =
        RecorderTesterMessageQueue { incoming_messages: Vec::new() };
    let mut environment: Environment = Environment::new();
    let rc_recorder_tester_message_queue = Rc::new(RefCell::new(recorder_tester_message_queue));

    {
        environment.router_mut().register_agent(Box::new(
            rc_recorder_tester_message_queue
                .clone(),
        ));
        debug_assert!(environment.router().agent().is_some());
    }
    let mut recorder_tester = RecorderTester {
        incoming_message_queue: rc_recorder_tester_message_queue,
        env: environment_unused,
    };
    let result = recorder_tester.run(environment);
    match result {
        Ok(()) => {}
        Err(e) => {
            assert!(false, "ERROR = {}", e.description().clone());
        }
    }
}

//pub enum ReplayAction {
//    Header(ReplayHeader),
//    Delta(GameAction),
//    Keyframe(SerializationInfo,GameAction),
//}

fn packet_source_is_agent(pkt: &ScaiiPacket) -> bool {
    if let Some(Endpoint::Agent(AgentEndpoint {})) = pkt.src.endpoint {
        return true;
    }
    false
}

fn packet_dest_is_recorder(pkt: &ScaiiPacket) -> bool {
    if let Some(Endpoint::Recorder(RecorderEndpoint {})) = pkt.dest.endpoint {
        return true;
    }
    false
}

fn spec_msg_is_recorder_config(pkt: &ScaiiPacket) -> bool {
    if let Some(scaii_packet::SpecificMsg::RecorderConfig(RecorderConfig { pkts: _ })) =
        pkt.specific_msg
    {
        return true;
    }
    false
}

fn cfg_payload_is_agentcfg(pkt: &ScaiiPacket) -> bool {
    match pkt.specific_msg {
        Some(scaii_packet::SpecificMsg::RecorderConfig(RecorderConfig { pkts: ref pkt_vec })) => {
            if pkt_vec.len() != 1 {
                return false;
            }
            let contained_pkt = &pkt_vec[0];
            match contained_pkt.specific_msg {
                Some(scaii_packet::SpecificMsg::Config(Cfg { which_module: Some(cfg::WhichModule::AgentCfg(AgentCfg { cfg_msg: Some(_),})),})) => true,
                _ => false,
            }
        }
        _ => false,
    }
}

fn verify_game_action_step(replay_action_result: &Result<ReplayAction, Box<ErrorKind>>) -> bool {
    match replay_action_result {
        &Ok(ref replay_action) => {
            match replay_action {
                &ReplayAction::Delta(GameAction::Step) => true,
                _ => {
                    assert!(
                        false,
                        "ERROR = expected Delta(GameAction::Step), got {:?}",
                        replay_action
                    );
                    false
                }
            }
        }
        &Err(ref e) => {
            assert!(false, "ERROR = {}", e.description().clone());
            false
        }
    }
}

fn verify_key_frame(replay_action: ReplayAction, replay_vec: &mut Vec<ReplayAction>) -> bool {
    match replay_action {
        ReplayAction::Keyframe(
            SerializationInfo { 
                source: SerializedProtosEndpoint { data: ref spe_data }, 
                data: SerializedProtosSerializationResponse { data: ref spsr_data }, 
            }, 
            GameAction::DecisionPoint(SerializedProtosAction { data: ref spa_data })) => {
                let endpoint = protos::Endpoint::decode(spe_data);
                match endpoint {
                    Ok(protos::Endpoint { endpoint: Some(Endpoint::Backend(BackendEndpoint {})) }) => {},
                    _ => assert!(false, "ERROR = expected backend endpoint in keyframe, got {:?}", endpoint),
                }
                let ser_response = SerializationResponse::decode(spsr_data);
                match ser_response {
                    Ok(SerializationResponse { serialized: ref ser_vec, format: an_i32 }) => {
                        assert!(ser_vec.len() == 3, "ERROR: expected 3 bytes in serialized {:?}", ser_response);
                        assert!(ser_vec[0] == 7,"ERROR: expected 7 {}", ser_vec[0]);
                        assert!(ser_vec[1] == 8,"ERROR: expected 8 {}", ser_vec[1]);
                        assert!(ser_vec[2] == 9,"ERROR: expected 9 {}", ser_vec[2]);
                        assert!(an_i32 == 1 as i32,"ERROR: expected format 1 {}", an_i32 );
                    },
                    _ => assert!(false, "ERROR = expected ser resp with 7,8,9, got {:?}", ser_response),
                }
                let protos_action = protos::Action::decode(spa_data);
                match protos_action {
                    Ok(protos::Action {
                        discrete_actions: i32vec,
                        continuous_actions: empty_vec,
                        alternate_actions: None,
                        explanation: None,}) => {
                            if !(i32vec.len() == 1 && i32vec[0] == 1 as i32) {
                                assert!(false, "ERROR = expected protos action to be discrete 1 , got {:?}", i32vec);
                            }
                            if empty_vec.len() != 0 {
                                assert!(false, "ERROR = expected no continuous actions , got {:?}", empty_vec);
                            }
                        },
                    _ => assert!(false, "ERROR = unexpected protos::Action {:?}", protos_action),
                }
                replay_vec.push(replay_action.clone());
                true
            }
        _ => {
            assert!(
                false,
                "ERROR = expected particular keyframe, got {:?}",
                replay_action
            );
            false
        }
    }

}

fn verify_persisted_file(path: &Path) -> Result<(), Box<Error>> {
    use super::ReplayAction;
    println!("verifying persisted file...");
    let replay_file = File::open(path).expect("file not found");
    let mut replay_vec: Vec<ReplayAction> = Vec::new();
    let mut reader = BufReader::new(replay_file);

    let replay_action_0 =
        deserialize_from::<BufReader<File>, ReplayAction, Infinite>(&mut reader, Infinite);
    // deser cfg scaiiPacket
    // header Ok(Header(ReplayHeader { configs: SerializedProtosScaiiPacket { data: [122, 6, 10, 4, 26, 2, 10, 0, 242, 1, 2, 50, 0, 250, 1, 2, 18, 0] } }))
    match replay_action_0 {
        Ok(header) => {
            match header {
                ReplayAction::Header(replay_header) => {
                    let vec = replay_header.configs.data;
                    let pkt = ScaiiPacket::decode(vec)?;
                    assert!(
                        packet_source_is_agent(&pkt),
                        "Expected packet source to be agent {:?}",
                        &pkt
                    );
                    assert!(
                        packet_dest_is_recorder(&pkt),
                        "Expected packet dest to be recorder {:?}",
                        &pkt
                    );
                    assert!(
                        spec_msg_is_recorder_config(&pkt),
                        "Expected specific message to be recorder config {:?}",
                        &pkt
                    );
                    assert!(
                        cfg_payload_is_agentcfg(&pkt),
                        "Expected AgentCfg {:?}",
                        &pkt
                    );
                }
                _ => {
                    assert!(
                        false,
                        "ERROR = expected ReplayAction::Header, got {:?}",
                        header
                    )
                }
            }
        }
        Err(e) => {
            assert!(false, "ERROR = {}", e.description().clone());
        }
    }
    let replay_action_1 =
        deserialize_from::<BufReader<File>, ReplayAction, Infinite>(&mut reader, Infinite);
    // deser SerializedProtosSerializationResponse
    // deser SerializedProtosAction
    let _result = verify_key_frame(replay_action_1.unwrap().clone(), &mut replay_vec);

    let replay_action_2 =
        deserialize_from::<BufReader<File>, ReplayAction, Infinite>(&mut reader, Infinite);
    // verify Delta(Step)
    //action deserialized as Delta(Step)
    verify_game_action_step(&replay_action_2);
    replay_vec.push(replay_action_2.unwrap());

    let replay_action_3 =
        deserialize_from::<BufReader<File>, ReplayAction, Infinite>(&mut reader, Infinite);
    // verify Delta(Step)
    //action deserialized as Delta(Step)
    verify_game_action_step(&replay_action_3);
    replay_vec.push(replay_action_3.unwrap());

    let replay_action_4 =
        deserialize_from::<BufReader<File>, ReplayAction, Infinite>(&mut reader, Infinite);
    // deser SerializedProtosSerializationResponse
    // deser SerializedProtosAction
    //action deserialized as Keyframe(SerializationInfo { source: SerializedProtosEndpoint { data: [10, 0] }, data: SerializedProtosSerializationResponse { data: [10, 3, 7, 8, 9, 16, 1] } }, DecisionPoint(SerializedProtosAction { data: [8, 1] }))
    let _result = verify_key_frame(replay_action_4.unwrap().clone(), &mut replay_vec);

    //replay_vec.push(replay_action_4);

    let replay_action_5 =
        deserialize_from::<BufReader<File>, ReplayAction, Infinite>(&mut reader, Infinite);
    // verify Delta(Step)
    //action deserialized as Delta(Step)
    verify_game_action_step(&replay_action_5);
    replay_vec.push(replay_action_5.unwrap());

    let replay_action_6 =
        deserialize_from::<BufReader<File>, ReplayAction, Infinite>(&mut reader, Infinite);
    // verify Delta(Step)
    //action deserialized as Delta(Step)
    verify_game_action_step(&replay_action_6);
    replay_vec.push(replay_action_6.unwrap());

    //while let Ok(action) = deserialize_from::<BufReader<File>,ReplayAction,Infinite>(&mut reader, Infinite) {
    //    println!("action deserialized as {:?}", action);
    //    replay_vec.push(action);
    //}


    assert!(
        replay_vec.len() == 6,
        "reconstructed ReplayAction list length incorrect: {}",
        replay_vec.len()
    );
    Ok(())
}

impl Backend for MockRts {
    fn supported_behavior(&self) -> BackendSupported {
        BackendSupported {
            serialization: SerializationStyle::None, // ignored for this test driver
        }
    }
}

impl Module for MockRts {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        let specific_msg = &msg.specific_msg;
        match specific_msg {
            &Some(scaii_packet::SpecificMsg::TestControl(protos::TestControl {
                                                             args: ref command_args,
                                                         })) => {
                let target: &String = &command_args[0];
                if target == &String::from("MockRts") {
                    let command: &String = &command_args[1];
                    match &command[..] {
                        "step" => {
                            self.step();
                        }
                        _ => {}
                    };
                }
            }
            _ => {
                println!("MOCKRTS process_message called with unknown");
            }
        }

        Ok(())
    }

    /// return empty messages.
    fn get_messages(&mut self) -> MultiMessage {
        protos::merge_multi_messages(self.outbound_messages.drain(..).collect())
            .unwrap_or(MultiMessage { packets: Vec::new() })
    }
}

struct MockRts {
    recorder_steps: Vec<String>,
    outbound_messages: Vec<protos::MultiMessage>,
    step_count: u32,
    iteration_count: u32,
    step_position: u32,
}

impl MockRts {
    fn init(&mut self) {
        self.recorder_steps = self.generate_recorder_step_sequence();
    }

    fn generate_recorder_step_sequence(&mut self) -> Vec<String> {
        println!(
            "generating MockRTS recorder step driving sequence for this many iterations:{}",
            self.iteration_count
        );
        let mut result: Vec<String> = Vec::new();
        for _i in 0..self.iteration_count {
            result.push(String::from("serialize"));
            result.push(String::from("action"));
            result.push(String::from("step"));
            result.push(String::from("step"));
        }
        println!("sequence is this long: {}", result.len());
        self.step_count = result.len() as u32;
        result
    }

    fn step(&mut self) {
        if self.step_position <= self.step_count {
            let recorder_step = self.recorder_steps[self.step_position as usize].clone();
            println!("STEP clue string serviced: {}", recorder_step);
            match &recorder_step[..] {
                "step" => {
                    self.send_step();
                }
                "serialize" => {
                    self.send_serialize();
                }
                "action" => {
                    self.send_action();
                }
                _ => {}
            }
            self.step_position = self.step_position + 1;
            println!("MockRTS.step_position now {}", self.step_position);
        }
        ()
    }

    fn send_step(&mut self) {
        println!("MockRTS sending step pkt...");
        let scaii_packet = self.create_step_pkt();
        self.outbound_messages.push(MultiMessage {
            packets: vec![scaii_packet],
        });
    }

    fn send_serialize(&mut self) {
        println!("MockRTS sending serialize pkt...");
        let scaii_packet = self.create_serialize_pkt();
        self.outbound_messages.push(MultiMessage {
            packets: vec![scaii_packet],
        });
    }

    fn send_action(&mut self) {
        println!("Mock RTS sending action pkt...");
        let scaii_packet = self.create_action_pkt();
        self.outbound_messages.push(MultiMessage {
            packets: vec![scaii_packet],
        });
    }

    fn create_step_pkt(&mut self) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint { endpoint: Some(Endpoint::Backend(BackendEndpoint {})) },
            dest: protos::Endpoint { endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})) },
            specific_msg: Some(scaii_packet::SpecificMsg::RecorderStep(RecorderStep {
                action: None,
                is_decision_point: false,
            })),
        }
    }

    fn create_serialize_pkt(&mut self) -> ScaiiPacket {
        let mut ser_vec: Vec<u8> = Vec::new();
        ser_vec.push(7 as u8);
        ser_vec.push(8 as u8);
        ser_vec.push(9 as u8);
        ScaiiPacket {
            src: protos::Endpoint { endpoint: Some(Endpoint::Backend(BackendEndpoint {})) },
            dest: protos::Endpoint { endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})) },
            specific_msg: Some(scaii_packet::SpecificMsg::SerResp(SerializationResponse {
                serialized: ser_vec,
                format: 1 as i32,
            })),
        }
    }

    fn create_action_pkt(&mut self) -> ScaiiPacket {
        let mut actions: Vec<i32> = Vec::new();
        actions.push(1);
        ScaiiPacket {
            src: protos::Endpoint { endpoint: Some(Endpoint::Backend(BackendEndpoint {})) },
            dest: protos::Endpoint { endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})) },
            specific_msg: Some(scaii_packet::SpecificMsg::RecorderStep(RecorderStep {
                action: Some(protos::Action {
                    discrete_actions: actions,
                    continuous_actions: Vec::new(),
                    alternate_actions: None,
                    explanation: None,
                }),
                is_decision_point: true,
            })),
        }
    }
}
