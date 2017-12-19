extern crate scaii_core;
extern crate scaii_defs;
extern crate bincode;
extern crate prost;
extern crate url;

use prost::Message;
use protos::{scaii_packet, AgentCfg, AgentEndpoint, cfg, Cfg, CoreEndpoint, Entity,
             MultiMessage, ScaiiPacket, BackendEndpoint, ModuleEndpoint, ReplayEndpoint, RecorderConfig, RecorderEndpoint,
             ReplayStep, ReplaySessionConfig, Viz, VizInit};
use protos::cfg::WhichModule;
use protos::user_command::UserCommandType;
use protos::endpoint::Endpoint;
use protos::scaii_packet::SpecificMsg;
use scaii_core::Environment;
use scaii_core::{SerializedProtosSerializationResponse,SerializedProtosAction, SerializedProtosScaiiPacket,
                SerializedProtosEndpoint,GameAction,ReplayAction,SerializationInfo,ReplayHeader};
use scaii_defs::protos;
use scaii_defs::{Backend, BackendSupported, Module, Replay, SerializationStyle};
use std::error::Error;
use std::{thread, time};
use std::rc::Rc;
use std::cell::RefCell;
use std::fmt;
use std::sync::{Arc, mpsc, Mutex};
use std::fs::File;
use std::path::{Path, PathBuf};
use std::io::BufReader;
use bincode::{deserialize_from, Infinite};

#[derive(Debug)]
struct ReplayError {
    details: String
}

impl ReplayError {
    fn new(msg: &str) -> ReplayError {
        ReplayError{details: msg.to_string()}
    }
}

impl fmt::Display for ReplayError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f,"{}",self.details)
    }
}

impl Error for ReplayError {
    fn description(&self) -> &str {
        &self.details
    }
}

#[derive(Debug)]
enum GameState {
    Running,
    Paused,
    RewoundAndNeedingToSendInitialKeyframe,
    JumpedAndNeedingToDoFollowupNavigation,
}

/// Replay owns the environment, but we need this
/// inside the environment (router) to collect messages
struct ReplayMessageQueue {
    incoming_messages: Vec<protos::ScaiiPacket>,
}

impl  Module for ReplayMessageQueue  {
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

impl Replay for ReplayMessageQueue {}


struct ReplayManager {
    incoming_message_queue:Rc<RefCell<ReplayMessageQueue>>, // going to go in router
    step_delay: Arc<Mutex<u64>>,
    poll_delay: Arc<Mutex<u64>>,
    shutdown_received: bool,
    env: Environment,
    replay_data: Vec<ReplayAction>,
    step_position: u64,
    test_mode: bool,
}

impl ReplayManager  {
    fn start(&mut self) -> Result<(), Box<Error>> {
        // startup viz via rpc
        let mm = wrap_packet_in_multi_message(create_rpc_config_message()?);
        self.env.route_messages(&mm);
        self.env.update();
        // pull off header and configure
        let header: ReplayAction = self.replay_data.remove(0);
        self.configure_as_per_header(header)?;
        let steps = self.replay_data.len() as i64;
        let mm = wrap_packet_in_multi_message(self.create_replay_session_config_message(steps));
        self.env.route_messages(&mm);
        self.env.update();

        self.run_and_poll()
    }

    fn create_replay_session_config_message(&mut self, steps : i64) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            },
            specific_msg: Some(SpecificMsg::ReplaySessionConfig( ReplaySessionConfig { step_count: steps})),
        }
    }

    fn configure_as_per_header(&mut self, header: ReplayAction) -> Result<(), Box<Error>> {
        match header {
            ReplayAction::Header(ReplayHeader { configs: SerializedProtosScaiiPacket { data:  u8_vec, }, }) => {
                let pkt = ScaiiPacket::decode(u8_vec)?;
                match pkt.specific_msg {
                    Some(scaii_packet::SpecificMsg::RecorderConfig(RecorderConfig { pkts: pkt_vec,})) => {
                        for pkt in pkt_vec.iter() {
                            let pkt_to_send= pkt.clone();
                            let mm = wrap_packet_in_multi_message(pkt_to_send);
                            self.env.route_messages(&mm);
                            self.env.update();
                            println!("==========================================sent config============");
                        }
                        Ok(())
                    }
                    _ => Err(Box::new(ReplayError::new(&format!("replay action header malformed - should contain RecorderConfig ScaiiPacket {:?}", pkt)[..])))
                }
            }
            _ => {
                Err(Box::new(ReplayError::new(&format!("replay action header malformed - should be ReplayAction::Header(ReplayHeader)... {:?}", header)[..])))
            }
        }
    }

    fn notify_viz_that_jump_completed(&mut self)  -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let pkt : ScaiiPacket = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Module(ModuleEndpoint {
                    name: "RpcPluginModule".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::UserCommand(protos::UserCommand {
                command_type: protos::user_command::UserCommandType::JumpCompleted as i32,
                args: Vec::new(),
            })),
        };
        let result = self.send_pkt_to_viz(pkt)?;
        Ok(result)
    }

    fn send_pkt_to_viz(&mut self, pkt: ScaiiPacket) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let mut to_send : Vec<protos::ScaiiPacket> = Vec::new();
        to_send.push(pkt);
        let mm = MultiMessage { packets: to_send };
        self.env.route_messages(&mm);
        self.env.update();
        let scaii_pkts : Vec<protos::ScaiiPacket> = { 
            let queue  = &mut *self.incoming_message_queue.borrow_mut();
            let result : Vec<protos::ScaiiPacket> = queue.incoming_messages.drain(..).collect();
            //println!("====================got result packets {} ", result.len());
            result
        };
        Ok(scaii_pkts)
    }

    fn poll_viz(&mut self) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let pkt : ScaiiPacket = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Module(ModuleEndpoint {
                    name: "RpcPluginModule".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::UserCommand(protos::UserCommand {
                command_type: protos::user_command::UserCommandType::PollForCommands as i32,
                args: Vec::new(),
            })),

        };
        let result = self.send_pkt_to_viz(pkt)?;
        Ok(result)
    }

    fn has_more_steps(&mut self) -> bool {
        if self.step_position <= self.replay_data.len() as u64 - 1 {
            true
        }
        else {
            false
        }
    }

    fn wrap_response_in_scaii_pkt(&mut self, ser_response : protos::SerializationResponse) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            },
            specific_msg: Some(scaii_defs::protos::scaii_packet::SpecificMsg::SerResp(ser_response)),
        }
    }

    fn convert_action_info_to_action_pkt(&mut self, action : GameAction) -> Result<ScaiiPacket, Box<Error>> {
        match action {
            GameAction::DecisionPoint(serialized_protos_action) => {
                let protos_action_decode_result = protos::Action::decode(serialized_protos_action.data);
                match protos_action_decode_result {
                    Ok(protos_action) => {
                        Ok(ScaiiPacket {
                            src: protos::Endpoint {
                                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
                            },
                            dest: protos::Endpoint {
                                endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
                            },
                            specific_msg: Some(scaii_defs::protos::scaii_packet::SpecificMsg::Action(protos_action)),
                        })
                    },
                    Err(err) => { return Err(Box::new(err)); }
                }
            }
            GameAction::Step => {
                Ok(ScaiiPacket {
                    src: protos::Endpoint {
                        endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
                    },
                    dest: protos::Endpoint {
                        endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
                    },
                    specific_msg: Some(scaii_defs::protos::scaii_packet::SpecificMsg::ReplayStep(ReplayStep{})),
                })
            }
        }
        
    }

    fn deploy_replay_directives_to_backend(&mut self, mm: MultiMessage) ->Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        self.env.route_messages(&mm);
        self.env.update();
        let scaii_pkts : Vec<protos::ScaiiPacket> = { 
            let queue  = &mut *self.incoming_message_queue.borrow_mut();
            let result : Vec<protos::ScaiiPacket> = queue.incoming_messages.drain(..).collect();
            result
        };
        Ok(scaii_pkts)
    }

    fn send_replay_action_to_backend(&mut self) -> Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        let empty_vec : Vec<protos::ScaiiPacket> = Vec::new();
        let replay_action : ReplayAction = self.replay_data[self.step_position as usize].clone();
        match replay_action {
            ReplayAction::Delta(action) => {
                println!("REPLAY found delta...");
                let action_pkt : ScaiiPacket = self.convert_action_info_to_action_pkt(action)?;
                let mut pkts: Vec<ScaiiPacket> = Vec::new();
                pkts.push(action_pkt);
                let mm = MultiMessage { packets: pkts };
                let scaii_pkts = self.deploy_replay_directives_to_backend(mm)?;
                Ok(scaii_pkts)
            }
            ReplayAction::Keyframe(serialization_info, action) => {
                println!("REPLAY found keyframe...");
                let ser_proto_ser_resp : SerializedProtosSerializationResponse = serialization_info.data;
                let ser_response_decode_result = protos::SerializationResponse::decode(ser_proto_ser_resp.data);
                match ser_response_decode_result {
                    Ok(ser_response) => {
                        let ser_response_pkt : ScaiiPacket = self.wrap_response_in_scaii_pkt(ser_response);
                        let action_pkt : ScaiiPacket = self.convert_action_info_to_action_pkt(action)?;
                        let mut pkts: Vec<ScaiiPacket> = Vec::new();
                        pkts.push(ser_response_pkt);
                        pkts.push(action_pkt);
                        let mm = MultiMessage { packets: pkts };
                        let scaii_pkts = self.deploy_replay_directives_to_backend(mm)?;
                        Ok(scaii_pkts)
                    }
                    Err(err) => {
                        Err(Box::new(err))
                    }
                }
                
            }
            ReplayAction::Header(_) => {
                Ok(empty_vec)
            }
        }
    }

    fn send_test_mode_jump_to_message(&mut self, target_step : &String) -> Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        let target : String = String::from("MockRts");
        let command : String = String::from("jumpTo");
        let mut args_list : Vec<String> = Vec::new();
        args_list.push(target);
        args_list.push(command);
        args_list.push(target_step.clone());
        let pkt : ScaiiPacket = self.create_test_control_message(args_list);
        return self.send_packet_to_backend(pkt);
    }

    fn send_packet_to_backend(&mut self, pkt: ScaiiPacket)-> Result<Vec<protos::ScaiiPacket>, Box<Error>>{
        let mut pkts: Vec<ScaiiPacket> = Vec::new();    
        pkts.push(pkt);
        let mm = MultiMessage { packets: pkts };
        let scaii_pkts = self.deploy_replay_directives_to_backend(mm)?;
        Ok(scaii_pkts)
    }

    fn create_test_control_message(&mut self, args_list : Vec<String>) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                 endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            },
            specific_msg: Some(scaii_defs::protos::scaii_packet::SpecificMsg::TestControl(protos::TestControl{args: args_list,})),
        }
    }

    fn send_test_mode_rewind_hint_message(&mut self) -> Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        let target : String = String::from("MockRts");
        let command : String = String::from("rewind");
        let mut args_list : Vec<String> = Vec::new();
        args_list.push(target);
        args_list.push(command);
        let pkt : ScaiiPacket = self.create_test_control_message(args_list);
        self.send_packet_to_backend(pkt)
    }

    fn send_test_mode_jump_to_hint_message(&mut self, target_index: u64) -> Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        let target : String = String::from("MockRts");
        let command : String = String::from("jump");
        let index: String = format!("{}",target_index);
        let mut args_list : Vec<String> = Vec::new();
        args_list.push(target);
        args_list.push(command);
        args_list.push(index);
        let pkt : ScaiiPacket = self.create_test_control_message(args_list);
        self.send_packet_to_backend(pkt)
    }

    fn execute_run_step(&mut self) -> Result<GameState, Box<Error>>{
        let mut game_state: GameState = GameState::Running;
        if self.has_more_steps() {
            let scaii_pkts =  self.send_replay_action_to_backend()?;
            self.step_position = self.step_position + 1;
            for scaii_pkt in scaii_pkts.iter() {
                if scaii_defs::protos::is_error_pkt(&scaii_pkt){
                    // Error would have already been shown to user at UI
                    println!("REPLAY ERROR received as result of run_step {:?}", scaii_pkt);
                }
                else {
                    println!("REPLAY unexpected pkt received after sending ReplayAction {:?}", scaii_pkt);
                }
            }
        }
        else {
            // game will automatically pause at end, switch to polling mode
            game_state = GameState::Paused;
        }
        Ok(game_state)
    }
   
    fn execute_poll_step(&mut self, mut game_state : GameState) -> Result<GameState, Box<Error>> {
        let scaii_pkts: Vec<ScaiiPacket> = self.poll_viz()?;
        for scaii_pkt in scaii_pkts.iter(){
            if scaii_defs::protos::is_user_command_pkt(&scaii_pkt){
                let user_command_args : Vec<String> = scaii_defs::protos::get_user_command_args(&scaii_pkt);
                // we would get args here when they are relevant
                let user_command_type = scaii_defs::protos::get_user_command_type(scaii_pkt)?;
                match user_command_type {
                    UserCommandType::None => { println!("================RECEIVED UserCommandType::None================");},
                    UserCommandType::Explain => {println!("================RECEIVED UserCommandType::Explain================");},
                    UserCommandType::Pause => { 
                        println!("================RECEIVED UserCommandType::Pause================");
                        game_state = GameState::Paused; 
                    },
                    UserCommandType::Resume => { game_state = GameState::Running; println!("================RECEIVED UserCommandType::Resume================"); },
                    UserCommandType::Rewind => {
                        println!("================RECEIVED UserCommandType::Rewind================"); 
                        self.step_position = 0;
                        if self.test_mode {
                            let _pkts :Vec<ScaiiPacket> = self.send_test_mode_rewind_hint_message()?;
                        }
                        game_state = GameState::RewoundAndNeedingToSendInitialKeyframe;
                    },
                    UserCommandType::PollForCommands => {println!("================RECEIVED UserCommandType::PollForCommands================");},
                    UserCommandType::JumpToStep => {
                        println!("================RECEIVED UserCommandType::JumpToStep================");
                        println!("args : {:?}", user_command_args);
                        let jump_target: &String = &user_command_args[0];
                        game_state = self.handle_jump_request(jump_target)?;
                    },
                    UserCommandType::JumpCompleted => {}, // sent to viz, not received from viz
                    UserCommandType::SetSpeed => {
                        println!("================RECEIVED UserCommandType::SetSpeed================");
                        let speed: &String = &user_command_args[0];
                        
                        self.adjust_replay_speed(speed)?;
                    }, 
                }
            }
            else if scaii_defs::protos::is_error_pkt(&scaii_pkt){
                // Error would have already been shown to user at UI
            }
            else {
                println!("REPLAY unexpected pkt received by Viz polling {:?}", scaii_pkt);
            }
        }
        wait(*self.poll_delay.lock().unwrap());
        Ok(game_state)
    }
    
    fn adjust_replay_speed(&mut self, speed_string : &String) -> Result<(), Box<Error>> {
        let speed = speed_string.parse::<u64>()?;
        // speed = 0  => 2001 ms or one ~ every 2 seconds
        // speed = 90 => 201 ms or ~ 5/sec,
        // speed = 100 => 1 ms
        let translation_step1: u64 = 100 as u64 - speed;
        let translation_step2: u64 = translation_step1 * 20;
        let msec_delay = translation_step2 + 1;
        println!(" speed string was {} and delay is {}", speed, msec_delay);
        let mut num = self.step_delay.lock().unwrap();
        *num = msec_delay;
        Ok(())
    }

    fn handle_jump_request(&mut self, jump_target: &String) ->  Result<GameState, Box<Error>> {
        let result = jump_target.parse::<u32>();
        match result {
            Ok(jump_target_int) => {
                if jump_target_int > self.replay_data.len() as u32 {
                    return Err(Box::new(ReplayError::new(&format!("Jump target {} not in range of step count {}", jump_target_int,self.replay_data.len()))));
                }
                self.step_position = jump_target_int as u64;
                if self.test_mode {
                    let _pkts :Vec<ScaiiPacket> = self.send_test_mode_jump_to_message(jump_target)?;
                }
            }
            Err(_) => {
                Box::new(ReplayError::new(&format!("Jump target {} not valid number.", jump_target)));
            }
        }
        
        Ok(GameState::JumpedAndNeedingToDoFollowupNavigation)
    }

    fn get_keyframe_index_prior_to_current_step_position(&mut self) -> Result<u64, Box<Error>>{
        let mut cur_index : u64 = self.step_position;
        let mut seeking : bool = true;
        while seeking {
            if cur_index < 0 as u64{
                return Err(Box::new(ReplayError::new(&format!("Jump-to navigation looked past 0 index for KeyFrame"))));
            }
            let cur_replay_action = &self.replay_data[cur_index as usize];
            match cur_replay_action {
                &ReplayAction::Header(_) => { } // has been removed from list by now - no need to take into account},
                &ReplayAction::Delta(_) => { cur_index = cur_index - 1; },
                &ReplayAction::Keyframe(_,_) => { seeking = false; },
            }
        }
        Ok(cur_index)
    }

    fn run_and_poll(&mut self) -> Result<(), Box<Error>>{
        let mut game_state : GameState = GameState::Running;
        let (tx_step, rx) = mpsc::channel();
        let (tx_step_ack, rx_step_ack) = mpsc::channel();
        let (tx_poll_ack, rx_poll_ack)= mpsc::channel();
        let tx_poll = mpsc::Sender::clone(&tx_step);
        let arc_poll_delay = Arc::clone(&self.poll_delay);
        // start poll nudge  thread
        let poll_nudge_handle = thread::spawn(move || {
            //let mut i: u64 = 0;
            loop {
                //println!("poll loop sending nudge {}", i);
                //i = i + 1;
                tx_poll.send(String::from("poll_nudge")).unwrap();
                let _ack = rx_poll_ack.recv().unwrap();
                wait(*arc_poll_delay.lock().unwrap());
            }
        });

        let arc_step_delay = Arc::clone(&self.step_delay);
        // start step nudge thread
        let step_nudge_handle = thread::spawn(move || {
            //let mut i: u64 = 0;
            loop {
                //println!("step loop sending nudge {}", i);
                //i = i + 1;
                tx_step.send(String::from("step_nudge")).unwrap();
                let _ack = rx_step_ack.recv().unwrap();
                wait(*arc_step_delay.lock().unwrap());
            }
        });
        //let mut snudge_count : u64 = 0;
        //let mut pnudge_count : u64 = 0;
        while !self.shutdown_received {
            let received = rx.recv();
            match received {
                Ok(nudge) => {
                    match nudge.as_ref() {
                        "step_nudge" => {
                            //println!("main loop got step_nudge {}", snudge_count);
                            //snudge_count = snudge_count + 1;
                            game_state = self.handle_step_nudge(game_state)?;
                            let _ack_result = tx_step_ack.send(String::from("ack")).unwrap();
                        },
                        "poll_nudge" => {
                            //println!("main loop got poll_nudge {}", pnudge_count);
                            //pnudge_count = pnudge_count + 1;
                            game_state = self.execute_poll_step(game_state)?; 
                            let _ack_result = tx_poll_ack.send(String::from("ack")).unwrap();
                             
                        },
                        _ => {},
                    } 
                }
                Err(receive_error) => return Err(Box::new(receive_error)),
            }
            //wait(50);
        }
        poll_nudge_handle.join().unwrap();
        step_nudge_handle.join().unwrap();
        Ok(())
    }

    fn handle_step_nudge(&mut self, mut game_state: GameState) -> Result<GameState, Box<Error>> {
        match game_state {
            GameState::Running => {
                game_state = self.execute_run_step()?;
            },
            GameState::Paused=> {
                // do nothing
            },
            GameState::RewoundAndNeedingToSendInitialKeyframe => {
                let _ignored_game_state : GameState = self.execute_run_step()?;
                game_state = GameState::Paused; // after rewind, we assume they don't want it to start playing
            },
            GameState::JumpedAndNeedingToDoFollowupNavigation => {
                let backup_target : u64 = self.get_keyframe_index_prior_to_current_step_position()?;
                let forward_target : u64 = self.step_position;
                self.keyframe_to_later_step(backup_target, forward_target)?;
                game_state = GameState::Paused;
            },
        }
        Ok(game_state)
    }

    // this should happen atomically - in between pollings, so no game_state change should be occurring so we can ignore
    fn keyframe_to_later_step(&mut self, keyframe_index: u64, target_index: u64) -> Result<(), Box<Error>>{
        if self.test_mode {
            let _pkts :Vec<ScaiiPacket> = self.send_test_mode_jump_to_hint_message(keyframe_index)?;
        }
        self.step_position = keyframe_index;
        while self.step_position <= target_index {
            let _game_state = self.execute_run_step()?;
        }
        let _result = self.notify_viz_that_jump_completed()?;
        Ok(())
    }
}

fn wait(milliseconds : u64) {
    let delay = time::Duration::from_millis(milliseconds);
    thread::sleep(delay);
}

fn wrap_packet_in_multi_message(pkt: ScaiiPacket) -> MultiMessage {
    let mut pkts: Vec<ScaiiPacket> = Vec::new();
    pkts.push(pkt);
    MultiMessage { packets: pkts }
}

fn get_viz_index_dot_html_filepath() -> Result<String, Box<Error>> {
    // needs to return "file:///C:/Users/Jed%20Irvine/exact/SCAII/viz/index.html" 
    // i.e. based on {SCAII_ROOT}/viz/index.html
    match std::env::var("SCAII_ROOT") {
        Ok(root) => {
            let mut pathbuf = PathBuf::from(root);
            pathbuf.push("viz");
            pathbuf.push("index.html");
            let path = pathbuf.as_path();
            let url_result = url::Url::from_file_path(&path);
            match url_result {
                Ok(url) => {
                    //let path_string = String::from(path.to_str());
                    let path_str = url.as_str();
                    println!("path_string is {}", path_str);
                    Ok(String::from(path_str))
                }
                Err(err) => {
                    let message = format!("Replay could convert html path to url. {:?} {:?}", path, err);
                    Err(Box::new(ReplayError::new(message.as_str())))
                }
            }
            
        },
        Err(e) => {
            let error_message = e.description().clone();
            let message = format!("Replay could not determine environment variable SCAII_ROOT. {}", error_message);
            Err(Box::new(ReplayError::new(message.as_str())))
        },
    }
}

fn get_chrome_command_for_windows() -> String {
    let result = String::from("C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe");
    result
}

fn get_default_browser_command_for_mac() -> Result<String, Box<Error>> {
    // needs to return "open <SCAII_ROOT>/viz/index.html"
    let html_file_path = get_viz_index_dot_html_filepath()?;
    let result = format!("open {}", html_file_path);
    Ok(result)
}

fn get_ui_html_filepath_for_windows() -> Result<String, Box<Error>> {
    // needs to return "<SCAII_ROOT>/viz/index.html"
    let result = get_viz_index_dot_html_filepath()?;
    Ok(result)
}

#[allow(unused_assignments)]
fn create_rpc_config_message() -> Result<ScaiiPacket, Box<Error>> {
    let mut comm : Option<String> = None;
    if cfg!(target_os = "windows") {
        let windows_command_string = get_chrome_command_for_windows();
        comm = Some(windows_command_string);
    }
    else if cfg!(target_os = "unix") {
        panic!("rpc config message for unix not yet implemented!");
    }
    else {
        // mac
        let mac_command_string = get_default_browser_command_for_mac()?;
        comm = Some(mac_command_string);
    }
    
    //
    // Add arguments on windows
    //
    let mut vec: Vec<String> = Vec::new();
    if cfg!(target_os = "windows") {
        let target_url = get_ui_html_filepath_for_windows()?;
        vec.push(target_url);
    }
    else if cfg!(target_os = "unix") {
        // will panic earlier in function if we are on unix
    }
    else {
        // mac adds no arguments - its all in command (workaround to browser launching issue on mac)
    }
    
    let rpc_config = scaii_core::get_rpc_config_for_viz(comm, vec);

    Ok(ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Agent(AgentEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Core(CoreEndpoint {})),
        },
        specific_msg: Some(SpecificMsg::Config(protos::Cfg {
            which_module: Some(WhichModule::CoreCfg(protos::CoreCfg {
                plugin_type: protos::PluginType {
                    plugin_type: Some(protos::plugin_type::PluginType::Rpc(rpc_config)),
                },
            })),
        })),
    })
}

fn wrap_entity_in_viz_packet(step: u32, entity: Entity) -> ScaiiPacket {
    let mut entities: Vec<Entity> = Vec::new();
    entities.push(entity);
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Module(ModuleEndpoint {
                //name: "viz".to_string(),
                name: "RpcPluginModule".to_string(),
            })),
        },
        specific_msg: Some(SpecificMsg::Viz(Viz { entities: entities, chart:None, step: Some(step) })),
    }
}

fn generate_entity_sequence(count: u32) -> Vec<Entity> {
    let mut entities: Vec<Entity> = Vec::new();
    let mut x: f64 = 300.0;
    let mut y: f64 = 300.0;
    for _i in 0..count {
        let entity = create_entity_at(&x, &y);
        entities.push(entity);
        x = x - 1.0;
        y = y  - 1.0;
    }
    entities
}

fn create_entity_at(x: &f64, y: &f64) -> Entity {
    Entity {
        id: 1,
        pos: Some(protos::Pos {
            x: Some(*x),
            y: Some(*y),
        }),
        shapes: vec![
            protos::Shape {
                id: 0,
                relative_pos: Some(protos::Pos {
                    x: Some(0.0),
                    y: Some(0.0),
                }),
                color: Some(protos::Color {
                    r: 0,
                    b: 0,
                    g: 255,
                    a: 255,
                }),
                rect: Some(protos::Rect {
                    width: Some(10.0),
                    height: Some(10.0),
                }),
                triangle: None,
                delete: false,
            },
        ],
        delete: false,
    }
}

fn get_test_mode_replay_header() -> Result<ReplayHeader, Box<Error>> {
    let config_packet  = create_cfg_pkt();
    let mut data_vec : Vec<u8> = Vec::new();
    let result = config_packet.encode(&mut data_vec);
    match result {
        Ok(_) => {
            let spsp = SerializedProtosScaiiPacket{
                data: data_vec,
            };
            // rpc is done by replay not at gameplay time so won't be in header
            // viz init will be sent by backend so not from here
            Ok(ReplayHeader {
                configs: spsp,
            })
        }
        Err(err) => {
            Err(Box::new(err))
        }
    }
    
}

fn create_cfg_pkt() -> ScaiiPacket {
    let mut vec: Vec<ScaiiPacket> = Vec::new();
    let cfg = Cfg {
        which_module: Some(cfg::WhichModule::AgentCfg(AgentCfg {
            cfg_msg: Some(Vec::new()),
        })),
    };
    let cfg_packet = ScaiiPacket {
        src: protos::Endpoint {  endpoint: Some(Endpoint::Agent(AgentEndpoint {}))},
        dest: protos::Endpoint { endpoint: Some(Endpoint::Backend(BackendEndpoint {}))},
        specific_msg: Some(scaii_packet::SpecificMsg::Config(cfg)),
    };
    vec.push(cfg_packet);
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Agent(AgentEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})),
        },
        specific_msg: Some(scaii_packet::SpecificMsg::RecorderConfig(RecorderConfig {
            pkts: vec,
        })),
    }
}

fn get_test_mode_key_frame() -> ReplayAction {
    let protos_ser_response = protos::SerializationResponse {
        serialized: Vec::new(),
        format: 1,
    };
    let mut psr_data : Vec<u8> = Vec::new();
    let _result = protos_ser_response.encode(&mut psr_data);
    let serialized_protos_ser_response = SerializedProtosSerializationResponse {
        data: psr_data,
    };
    let endpoint = protos::Endpoint { endpoint: Some(Endpoint::Backend(BackendEndpoint {})),};
    let mut ept_data : Vec<u8> = Vec::new();
    let _result = endpoint.encode(&mut ept_data);
    let serialized_protos_endpoint = SerializedProtosEndpoint {
        data: ept_data,
    };
    let ser_info = SerializationInfo {
        source: serialized_protos_endpoint,
        data: serialized_protos_ser_response,
    };
    let action = GameAction::Step;
    ReplayAction::Keyframe(ser_info, action)
}

fn get_test_mode_replay_info(step_count: u32, interval: u32) -> Result<Vec<ReplayAction>, Box<Error>> {
    let mut result: Vec<ReplayAction> = Vec::new();
    // add Header
    let replay_header = get_test_mode_replay_header()?;
    result.push(ReplayAction::Header(replay_header));

    for number in 0..step_count {
        if number % interval == 0 {
            let key_frame = get_test_mode_key_frame();
            result.push(key_frame);
        }
        else if number % interval == 1 {
            let mut d_actions : Vec<i32> = Vec::new();
            d_actions.push(3);
            let protos_action = protos::Action{
                discrete_actions: d_actions,
                continuous_actions: Vec::new(),
                alternate_actions:None,
            };
            let mut serialized_protos_action_bytes : Vec<u8> = Vec::new();
            let protos_action_encode_result = protos_action.encode(&mut serialized_protos_action_bytes);
            match protos_action_encode_result {
                Ok(_) => {
                    let serialized_protos_action = SerializedProtosAction {
                        data: serialized_protos_action_bytes,
                    };
                    let delta_1 = ReplayAction::Delta(GameAction::DecisionPoint(serialized_protos_action));
                    result.push(delta_1);
                },
                Err(err) => {
                    return Err(Box::new(err));
                }
            }
            
        }
        else {
            let delta_2 = ReplayAction::Delta(GameAction::Step);
            result.push(delta_2);
        }
    }
    Ok(result)
}

fn load_replay_file(path: &Path)  -> Result<Vec<ReplayAction>, Box<Error>> {
    //use super::ReplayAction;
    println!("loading replay file...");
    let replay_file = File::open(path).expect("file not found");
    let mut replay_vec : Vec<ReplayAction> = Vec::new();
    let mut reader = BufReader::new(replay_file);

    while let Ok(action) = deserialize_from::<BufReader<File>,ReplayAction,Infinite>(&mut reader, Infinite) {
        println!("action deserialized as {:?}", action);
        replay_vec.push(action);
    }
    Ok(replay_vec)
}

fn load_replay_info_from_recorder_produced_file() -> Result<Vec<ReplayAction>, Box<Error>> {
    let path_result = scaii_core::get_default_replay_file_path();
    match path_result {
        Ok(path) => {
            let load_result = load_replay_file(&path);
            match load_result {
                Ok(replay_vec) => {
                    Ok(replay_vec)
                }
                Err(err) => Err(err)
            }
        }
        Err(err) => {
            Err(err)
        }
    }
}
#[allow(dead_code)]
enum RunMode {
    Live,
    TestUsingDataFromFileGeneratedByRecorder,
    TestUsingDataGeneratedLocally,
}

#[allow(unused_assignments)]
fn main() {
    let mut environment : Environment = Environment::new();
    let run_mode = RunMode::TestUsingDataFromFileGeneratedByRecorder;
    //let run_mode = RunMode::TestUsingDataGeneratedLocally;
    //let run_mode = RunMode::Live;
    let mut replay_info : Vec<ReplayAction> = Vec::new();
    match run_mode{
        RunMode::TestUsingDataFromFileGeneratedByRecorder => {
            configure_and_register_mock_rts(&mut environment);
            replay_info = load_replay_info_from_recorder_produced_file().expect("Error - problem generating test replay_info");
        }
        RunMode::TestUsingDataGeneratedLocally => {
            configure_and_register_mock_rts(&mut environment);
            let step_count : u32 = 300;
            let interval : u32 = 5;
            replay_info = get_test_mode_replay_info(step_count,interval).expect("Error - problem generating test replay_info");
        }
        RunMode::Live => {
            println!("Live run mode not yet implemented...");
            return;
        }
    }
    
    let replay_message_queue = ReplayMessageQueue {
        incoming_messages: Vec::new(),
    };
    let rc_replay_message_queue = Rc::new(RefCell::new(replay_message_queue));
    {
        environment.router_mut().register_replay(Box::new(rc_replay_message_queue.clone()));
        debug_assert!(environment.router().replay().is_some());
    }
    let mut replay_manager =  ReplayManager {
        incoming_message_queue:rc_replay_message_queue,
        step_delay: Arc::new(Mutex::new(201)),
        poll_delay: Arc::new(Mutex::new(50)),
        shutdown_received: false,
        env: environment,
        replay_data: replay_info,
        step_position: 0,
        test_mode: false,
    };
    match run_mode {
        RunMode::TestUsingDataFromFileGeneratedByRecorder => replay_manager.test_mode = true,
        RunMode::TestUsingDataGeneratedLocally =>            replay_manager.test_mode = true,
        RunMode::Live =>                                     replay_manager.test_mode = false,
    }
    let result = replay_manager.start();
    match result {
        Ok(_) => {},
        Err(e) => {
            println!("Replay Error {:?}", e);
            return;
        }
    }
}

fn configure_and_register_mock_rts(env: &mut Environment){
    let rts = MockRts {
        viz_sequence: Vec::new(),
        outbound_messages: Vec::new(),
        step_position: 0,
        step_count: 0,
        sent_viz_init: false,
    };
    
    {
        env.router_mut().register_backend(Box::new(rts));
    } 
}


struct MockRts {
    viz_sequence: Vec<protos::ScaiiPacket>,
    outbound_messages: Vec<protos::MultiMessage>,
    step_count : u32,
    step_position: u32,
    sent_viz_init: bool,
}

impl MockRts {
    fn init_entity_sequence(&mut self) {
        let mut entities = generate_entity_sequence(self.step_count);
        for i in 0..self.step_count {
            let entity = entities.remove(0);
            let viz: ScaiiPacket = wrap_entity_in_viz_packet(i, entity);
            self.viz_sequence.push(viz);
        }
    }

    fn step(&mut self){
        let pkt_to_send = self.viz_sequence[self.step_position as usize].clone();
        self.step_position = self.step_position + 1;
        println!("MockRTS self.step_position now {}", self.step_position);
        let mm = wrap_packet_in_multi_message(pkt_to_send);
        self.outbound_messages.push(mm);
        ()
    }

    fn send_viz_init(&mut self) {
        let scaii_packet_viz_init = self.create_test_viz_init(400, 400);
        self.outbound_messages.push(MultiMessage { packets: vec![scaii_packet_viz_init] });
    }

    fn create_test_viz_init(&mut self, width: u32, height: u32) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Agent(AgentEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Module(ModuleEndpoint {
                    name: "RpcPluginModule".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::VizInit(VizInit {
                test_mode: Some(false),
                step_count: Some(self.step_count),
                gameboard_width: Some(width),
                gameboard_height: Some(height),
                explanations : Vec::new(),
            })),
        }
    }
}

impl Backend for MockRts {
    fn supported_behavior(&self) -> BackendSupported {
        BackendSupported {
            serialization: SerializationStyle::None,
        }
    }
}

impl Module for MockRts {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>>{
        let specific_msg = &msg.specific_msg;
        match specific_msg {
            &Some(scaii_packet::SpecificMsg::SerResp(protos::SerializationResponse { serialized: _ , format: _ })) => {
                if self.sent_viz_init == false {
                    println!("MOCKRTS sending viz init!");
                    self.send_viz_init();
                    self.sent_viz_init= true;
                }
            },
            &Some(scaii_packet::SpecificMsg::ReplaySessionConfig(protos::ReplaySessionConfig { step_count: steps })) => {
                self.step_count = steps as u32;
                self.init_entity_sequence();
            },
            &Some(scaii_packet::SpecificMsg::ReplayStep(protos::ReplayStep { })) => {
                if self.step_position < self.step_count {
                    println!("MOCKRTS step due to replayStep!");
                    self.step();
                }
            },
            &Some(scaii_packet::SpecificMsg::Action(protos::Action { discrete_actions: _ , continuous_actions: _, alternate_actions: _})) => {
                if self.step_position < self.step_count {
                    println!("MOCKRTS step due to agent Action!");
                    self.step();
                }
            },
            &Some(scaii_packet::SpecificMsg::TestControl(protos::TestControl { args: ref command_args})) => {
                let target : &String = &command_args[0];
                if target == &String::from("MockRts"){
                    let command : &String = &command_args[1];
                    match &command[..] {
                       "rewind" => {
                            self.step_position = 0;
                        },
                        "jump" => {
                            let jump_target: &String = &command_args[2];
                            let result = jump_target.parse::<u32>();
                            match result {
                                Ok(jump_target_int) => {
                                    self.step_position = jump_target_int;
                                    println!("MockRTS jump target int was {}", jump_target_int);
                                },
                                Err(_) => {
                                    Box::new(ReplayError::new(&format!("Jump target {} not valid number.", jump_target)));
                                },
                            };
                            
                        },
                        _ => {}
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

