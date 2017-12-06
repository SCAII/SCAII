use super::*;
use super::super::super::Environment;
use scaii_defs::protos;
use scaii_defs::{Agent, Backend, BackendSupported, Module, Recorder, SerializationStyle};
use scaii_defs::protos::{scaii_packet, AgentCfg, AgentEndpoint, cfg, Cfg,
             MultiMessage, ScaiiPacket, BackendEndpoint, RecorderConfig, RecorderEndpoint, 
             SerializationResponse};
use scaii_defs::protos::endpoint::Endpoint;
use scaii_defs::protos::scaii_packet::SpecificMsg;
use std::error::Error;
use std::rc::Rc;
use std::cell::RefCell;
use std::fs::File;
use bincode::{deserialize_from, Infinite};
use std::io::BufReader;


struct RecorderTesterMessageQueue {
    incoming_messages: Vec<protos::ScaiiPacket>,
}

impl  Module for RecorderTesterMessageQueue  {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>>{
         self.incoming_messages.push(msg.clone());
         Ok(())
    }

    /// return empty messages
    fn get_messages(&mut self) -> MultiMessage{
        let pkts: Vec<ScaiiPacket> = Vec::new();
        MultiMessage { packets: pkts }
    }
}



struct RecorderTester {
    incoming_message_queue:Rc<RefCell<RecorderTesterMessageQueue>>,
    env: Environment,
}
impl Agent for RecorderTesterMessageQueue {}
    

impl RecorderTester {
    fn run(&mut self, env: Environment) -> Result<(), Box<Error>>{
        self.env = env;
        let step_count : u32 = 2;
        
        self.configure_and_register_mock_rts(step_count);
        let mut recorder_manager =  RecorderManager::new();
        recorder_manager.init();
        
        let rc_recorder_manager = Rc::new(RefCell::new(recorder_manager));
        {
            self.env.router_mut().register_recorder(Box::new(rc_recorder_manager.clone()));
            debug_assert!(self.env.router().recorder().is_some());
        }
        let cfg_pkt = self.create_cfg_pkt();
        let result = self.send_packet(cfg_pkt);
        let total: u32 = step_count * 4;
        for i in 0..total {
            println!("sending send_test_mode_step_hint_message {}", i);
            let _pkts :Vec<ScaiiPacket> = self.send_test_mode_step_hint_message()?;
        }
        rc_recorder_manager.borrow_mut().stop_recording();
        verify_persisted_file();
        Ok(())
    }
    fn create_test_control_message(&mut self, args_list : Vec<String>) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})),
            },
            dest: protos::Endpoint {
                    endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            },
            specific_msg: Some(SpecificMsg::TestControl(protos::TestControl{args: args_list,})),
        }
    }
    fn send_test_mode_step_hint_message(&mut self, ) -> Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        let target : String = String::from("MockRts");
        let command : String = String::from("step");
        let mut args_list : Vec<String> = Vec::new();
        args_list.push(target);
        args_list.push(command);
        let pkt : ScaiiPacket = self.create_test_control_message(args_list);
        self.send_packet(pkt)
    }


    fn send_packet(&mut self, pkt: ScaiiPacket)-> Result<Vec<protos::ScaiiPacket>, Box<Error>>{
        let mut pkts: Vec<ScaiiPacket> = Vec::new();    
        pkts.push(pkt);
        let mm = MultiMessage { packets: pkts };
        let scaii_pkts = self.send_multimessage(mm)?;
        Ok(scaii_pkts)
    }
    fn send_multimessage(&mut self, mm: MultiMessage) ->Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        self.env.route_messages(&mm);
        self.env.update();
        let scaii_pkts : Vec<protos::ScaiiPacket> = { 
            let queue  = &mut *self.incoming_message_queue.borrow_mut();
            let result : Vec<protos::ScaiiPacket> = queue.incoming_messages.drain(..).collect();
            result
        };
        Ok(scaii_pkts)
    }
    // need to add a recorderConfig message (sent by agent)  - it will contain repeated Cfg  to capture the various configs
    // if recorder gets recorderConfig message , it starts recordings
    // so always be instantiated by core, just will remain dormant unless it gets that message
    // don't need a special proto message to convey the list of Cfg's because I can just persist them as part of structs and then send individual Cfg messages around at replay time.


    fn create_cfg_pkt(&mut self, ) -> ScaiiPacket {
        let mut cfg_vec: Vec<Cfg> = Vec::new();
        let cfg = Cfg {
            which_module: Some(cfg::WhichModule::AgentCfg(AgentCfg {
                cfg_msg: Some(Vec::new()),
            })),
        };
        cfg_vec.push(cfg);
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Agent(AgentEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::RecorderConfig(RecorderConfig {
                cfgs: cfg_vec,
            })),
        }
    }


    fn configure_and_register_mock_rts(&mut self,count : u32){
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
    let environment_unused : Environment = Environment::new();
    let recorder_tester_message_queue = RecorderTesterMessageQueue {
        incoming_messages: Vec::new(),
    };
    let mut environment: Environment = Environment::new();
    let rc_recorder_tester_message_queue = Rc::new(RefCell::new(recorder_tester_message_queue));

    {
        environment.router_mut().register_agent(Box::new(rc_recorder_tester_message_queue.clone()));
        debug_assert!(environment.router().agent().is_some());
    }
    let mut recorder_tester = RecorderTester {
        incoming_message_queue:rc_recorder_tester_message_queue,
        env: environment_unused,
    };
    let _result = recorder_tester.run(environment);
}

fn verify_persisted_file() {
    use super::ReplayAction;
    println!("verifying persisted file...");
    let replay_file = File::open("C:\\Users\\Jed Irvine\\exact\\SCAII\\core\\replay_data\\replay_data.txt").expect("file not found");
    let mut replay_vec : Vec<ReplayAction> = Vec::new();
    let mut reader = BufReader::new(replay_file);
    let header = deserialize_from::<BufReader<File>,ReplayAction,Infinite>(&mut reader, Infinite);
    println!("header {:?}", header);
    while let Ok(action) = deserialize_from::<BufReader<File>,ReplayAction,Infinite>(&mut reader, Infinite) {
        println!("action deserialized as {:?}", action);
        replay_vec.push(action);
    }


    //let mut buf: Vec<u8> = Vec::new();
    //f.read_to_end(&mut buf).expect("could not read all bytes from file");
    //let decoded: Vec<ReplayAction> = deserialize(&buf[..]).unwrap();
    //for i in 0..replay_vec.len() {
    //    println!("REPLAY ACTION : {:?}", replay_vec[i]);
    //}
    //verify
    println!("decoded replay has this many elements {}", replay_vec.len());
}

impl Backend for MockRts {
        fn supported_behavior(&self) -> BackendSupported {
            BackendSupported {
                serialization: SerializationStyle::None, // ignored for this test driver
            }
        }
    }

impl Module for MockRts {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>>{
        let specific_msg = &msg.specific_msg;
        match specific_msg {
            &Some(scaii_packet::SpecificMsg::TestControl(protos::TestControl { args: ref command_args})) => {
                let target : &String = &command_args[0];
                if target == &String::from("MockRts"){
                    let command : &String = &command_args[1];
                    match &command[..] {
                        "step" => { self.step();},
                        _ => {},
                    };
                }
            },
            _ => {
                println!("MOCKRTS process_message called with unknown");
            },
        }
        
        Ok(())
    }

    /// return empty messages.
    fn get_messages(&mut self) -> MultiMessage{
        protos::merge_multi_messages(self.outbound_messages.drain(..).collect()).unwrap_or(
            MultiMessage {
                packets: Vec::new(),
            },
        )
    }
}

struct MockRts {
    recorder_steps: Vec<String>,
    outbound_messages: Vec<protos::MultiMessage>,
    step_count : u32,
    iteration_count: u32,
    step_position: u32,
}

impl MockRts {
    fn init(&mut self) {
        self.recorder_steps = self.generate_recorder_step_sequence();
    }

    fn generate_recorder_step_sequence(&mut self) -> Vec<String> {
        println!("generating MockRTS recorder step driving sequence for this many iterations:{}", self.iteration_count);
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

    fn step(&mut self){
        if self.step_position <= self.step_count {
            let recorder_step = self.recorder_steps[self.step_position as usize].clone();
            println!("STEP clue string serviced: {}", recorder_step);
            match &recorder_step[..] {
                "step" =>      { self.send_step();      },
                "serialize" => { self.send_serialize(); },
                "action" =>    { self.send_action();    },
                _ => {},
            }
            self.step_position = self.step_position + 1;
            println!("MockRTS.step_position now {}", self.step_position);
        }
        ()
    }

    fn send_step(&mut self) {
        println!("MockRTS sending step pkt...");
        let scaii_packet = self.create_step_pkt();
        self.outbound_messages.push(MultiMessage { packets: vec![scaii_packet] });
    }

    fn send_serialize(&mut self) {
        println!("MockRTS sending serialize pkt...");
        let scaii_packet = self.create_serialize_pkt();
        self.outbound_messages.push(MultiMessage { packets: vec![scaii_packet] });
    }

    fn send_action(&mut self) {
        println!("Mock RTS sending action pkt...");
        let scaii_packet = self.create_action_pkt();
        self.outbound_messages.push(MultiMessage { packets: vec![scaii_packet] });
    }

    fn create_step_pkt(&mut self) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::RecorderStep(RecorderStep {
                action: None,
                is_decision_point: false,
            })),
        }
    }

    fn create_serialize_pkt(&mut self) -> ScaiiPacket {
        let mut ser_vec : Vec<u8> = Vec::new();
        ser_vec.push(7 as u8);
        ser_vec.push(8 as u8);
        ser_vec.push(9 as u8);
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::SerResp(SerializationResponse {
                serialized: ser_vec,
                format: 1 as i32,
            })),
        }
    }

    fn create_action_pkt(&mut self) -> ScaiiPacket {
        let mut actions : Vec<i32> = Vec::new();
        actions.push(1);
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::RecorderStep(RecorderStep {
                action: Some(protos::Action {
                    discrete_actions: actions,
                    continuous_actions: Vec::new(),
                    alternate_actions: None,}),
                is_decision_point: true,
            })),
        }
    }
}