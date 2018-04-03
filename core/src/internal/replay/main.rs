extern crate bincode;
extern crate prost;
extern crate scaii_core;
extern crate scaii_defs;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate url;

use prost::Message;
use protos::{scaii_packet, BackendEndpoint, Cfg, ExplanationDetails, ExplanationPoint,
             ModuleEndpoint, MultiMessage, PluginType, RecorderConfig, ReplayControl,
             ReplayEndpoint, ScaiiPacket};
use protos::plugin_type::PluginType::SkyRts;
use protos::cfg::WhichModule;
use protos::user_command::UserCommandType;
use protos::endpoint::Endpoint;
use protos::scaii_packet::SpecificMsg;
use scaii_core::{ActionWrapper, Environment, ReplayAction, ReplayHeader,
                 SerializedProtosScaiiPacket, SerializedProtosSerializationResponse};
use scaii_defs::protos;
use scaii_defs::{Agent, Module, Replay};
use std::error::Error;
use std::{thread, time};
use std::rc::Rc;
use std::cell::RefCell;
use std::fmt;
use std::sync::{Arc, Mutex};
use std::path::Path;
use std::env;
use std::collections::BTreeMap;

mod test_util;
use test_util::*;
mod webserver;
use webserver::launch_webserver;
mod replay_util;
mod replay_sequencer;
use replay_sequencer::ReplaySequencer;
mod explanations;
use explanations::Explanations;

#[cfg(test)]
mod test;

const USAGE: &'static str = "
replay.

Usage:
  replay webserver
  replay file [--filename <path-to-replay-file>]
  replay test [--data-hardcoded | --data-from-recorded-file]
  replay (-h | --help)

Options:
  --filename=<path-to-replay-file>  path to the replay file to run.
  --data_hardcoded              data generated within local replay tester code.
  --data_from_recorded_file     data generated by recorder test output file.
  -h --help                     Show this screen.
";

#[derive(Debug, Deserialize)]
struct Args {
    cmd_webserver: bool,
    //
    cmd_test: bool,
    flag_data_from_recorded_file: bool,
    flag_data_hardcoded: bool,
    //
    cmd_file: bool,
    flag_filename: bool,
    arg_path_to_replay_file: String,
}

#[derive(Debug)]
struct ReplayError {
    details: String,
}

impl ReplayError {
    fn new(msg: &str) -> ReplayError {
        ReplayError {
            details: msg.to_string(),
        }
    }
}

impl fmt::Display for ReplayError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.details)
    }
}

impl Error for ReplayError {
    fn description(&self) -> &str {
        &self.details
    }
}

#[derive(Debug)]
enum GameState {
    AwaitingUserPlayRequest,
    Running,
    Paused,
}

// need to register dummy agent to keep RTS happy during replay
struct DummyAgentMessageQueue {
    incoming_messages: Vec<protos::ScaiiPacket>,
}

impl Module for DummyAgentMessageQueue {
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

impl Agent for DummyAgentMessageQueue {}

/// Replay owns the environment, but we need this
/// inside the environment (router) to collect messages
struct ReplayMessageQueue {
    incoming_messages: Vec<protos::ScaiiPacket>,
}

impl Module for ReplayMessageQueue {
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

impl Replay for ReplayMessageQueue {}

struct ReplayManager {
    incoming_message_queue: Rc<RefCell<ReplayMessageQueue>>, // going to go in router
    step_delay: Arc<Mutex<u64>>,
    poll_delay: Arc<Mutex<u64>>,
    shutdown_received: bool,
    env: Environment,
    replay_sequencer: ReplaySequencer,
    explanations_option: Option<Explanations>,
    test_mode: bool,
    poll_timer_count: u32,
    step_timer_count: u32,
}

impl ReplayManager {
    fn start(&mut self) -> Result<(), Box<Error>> {
        // startup viz via rpc
        let mm =
            replay_util::wrap_packet_in_multi_message(replay_util::create_rpc_config_message()?);
        self.env.route_messages(&mm);
        self.env.update();
        if self.test_mode {
            let step_count: u32 = 300;
            let interval: u32 = 5;
            let replay_actions = concoct_replay_info(step_count, interval)
            .expect("Error - problem generating test replay_info");
            let replay_sequencer = ReplaySequencer::new(&replay_actions, false)?;
            self.replay_sequencer = replay_sequencer;
        }
        else {
            let replay_filenames = replay_util::get_replay_filenames()?;
            let replay_choice_config = replay_util::get_replay_choice_config_message(replay_filenames);
            let mm = replay_util::wrap_packet_in_multi_message(replay_choice_config);
            self.env.route_messages(&mm);
            self.env.update();
        }
        self.run_and_poll()
    }

    fn load_selected_replay_file(&mut self, filename: String)-> Result<(), Box<Error>> {
        use std::path::PathBuf;
        let mut replay_path = scaii_core::get_default_replay_dir()?;
        replay_path.push(filename.as_str());
        let mut replay_actions: Vec<ReplayAction> = {
            let path = Path::new(&replay_path);
            if !path.exists() {
                return Err(Box::new(ReplayError::new(&format!(
                    "ERROR - specified replay path does not exist {:?}",
                    path
                ))));
            }
            replay_util::load_replay_file(&path.to_path_buf())
                .expect("Error - problem generating test replay_actions")
        };
        let header = replay_actions.remove(0);
        println!(
            "replay_actions this long after header removed {}",
            replay_actions.len()
        );
        let mut replay_sequencer = ReplaySequencer::new(&mut replay_actions, false)?;
        let mut r_actions_sans_explanations: Vec<ReplayAction> = Vec::new();
        let explanation_points: Vec<ExplanationPoint> = explanations::extract_explanations(
            replay_actions,
            &mut r_actions_sans_explanations,
        )?;
        let mut explanations_option = explanations::map_explanations(explanation_points)?;
        if explanations::is_empty(&explanations_option) {
            println!(
                "using specified replay file to find expl file!{:?}",
                replay_path
            );
            explanations_option = explanations::get_explanations_for_replay_file(
                PathBuf::from(replay_path.clone()),
            )?;
        }
        self.explanations_option = explanations_option;
        replay_sequencer.print_length();
        let count = replay_sequencer.get_sequence_length();
        self.replay_sequencer = replay_sequencer;
            

        // pull off header and configure
        let replay_session_cfg =
            replay_util::get_replay_configuration_message(count, &self.explanations_option);
        self.configure_as_per_header(header, replay_session_cfg)?;
        Ok(())
    }
    fn adjust_cfg_packets(
        &mut self,
        cfg_pkts: Vec<ScaiiPacket>,
        replay_session_cfg_pkt_for_ui: ScaiiPacket,
    ) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let mut temp_vec: Vec<ScaiiPacket> = Vec::new();
        let mut result_vec: Vec<ScaiiPacket> = Vec::new();
        let mut rust_ffi_config_pkt: Option<ScaiiPacket> = None;
        let mut backend_config_pkt: Option<ScaiiPacket> = None;

        for pkt in cfg_pkts {
            match pkt.specific_msg {
                Some(SpecificMsg::Config(Cfg {
                    which_module: Some(WhichModule::BackendCfg(protos::BackendCfg { .. })),
                })) => {
                    backend_config_pkt = Some(pkt);
                }
                Some(SpecificMsg::Config(Cfg {
                    which_module:
                        Some(WhichModule::CoreCfg(protos::CoreCfg {
                            plugin_type:
                                PluginType {
                                    plugin_type: Some(SkyRts(protos::SkyRts {})),
                                },
                        })),
                })) => {
                    rust_ffi_config_pkt = Some(pkt);
                }
                _ => {
                    temp_vec.push(pkt);
                }
            }
        }

        if rust_ffi_config_pkt == None && !self.test_mode {
            rust_ffi_config_pkt = Some(replay_util::create_rts_backend_msg()?);
        }

        if backend_config_pkt == None {
            backend_config_pkt = Some(replay_util::create_default_replay_backend_config());
        } else {
            // need to change replay_mode to true
            replay_util::set_replay_mode_on_backend_config(&mut backend_config_pkt);
        }

        if !self.test_mode {
            result_vec.push(rust_ffi_config_pkt.unwrap());
        }

        // next send replay_mode == true signal
        let replay_mode_pkt = replay_util::get_replay_mode_pkt();
        result_vec.push(replay_mode_pkt);
        // then send ReplaySessionConfig pkt to UI
        result_vec.push(replay_session_cfg_pkt_for_ui);
        // then send emit_viz directive
        let emit_viz_pkt = replay_util::get_emit_viz_pkt();
        result_vec.push(emit_viz_pkt);
        result_vec.push(backend_config_pkt.unwrap());
        for pkt in temp_vec {
            result_vec.push(pkt);
        }
        Ok(result_vec)
    }

    fn emit_cfg_packets(&mut self, cfg_pkts: Vec<ScaiiPacket>) -> Result<(), Box<Error>> {
        for pkt in &cfg_pkts {
            let pkt_to_send = pkt.clone();
            let mm = replay_util::wrap_packet_in_multi_message(pkt_to_send);
            self.env.route_messages(&mm);
            self.env.update();
        }
        Ok(())
    }

    fn configure_as_per_header(
        &mut self,
        header: ReplayAction,
        replay_session_cfg_pkt_for_ui: ScaiiPacket,
    ) -> Result<(), Box<Error>> {
        match header {
            ReplayAction::Header(ReplayHeader {
                                     configs: SerializedProtosScaiiPacket { data: u8_vec },
                                 }) => {
                let pkt = ScaiiPacket::decode(u8_vec)?;
                match pkt.specific_msg {
                    Some(scaii_packet::SpecificMsg::RecorderConfig(RecorderConfig {
                                                pkts: pkt_vec, overwrite: _, filepath: _
                                                                   })) => {
                        let adjusted_cfg_pkts = self.adjust_cfg_packets(pkt_vec, replay_session_cfg_pkt_for_ui)?;
                        self.emit_cfg_packets(adjusted_cfg_pkts)
                    }
                    _ => Err(Box::new(ReplayError::new(
                        &format!(
                            "replay action header malformed - should contain RecorderConfig ScaiiPacket {:?}",
                            pkt
                        )
                            [..],
                    ))),
                }
            }
            _ => {
                Err(Box::new(ReplayError::new(
                    &format!(
                        "replay action header malformed - should be ReplayAction::Header(ReplayHeader)... {:?}",
                        header
                    )
                        [..],
                )))
            }
        }
    }


    fn tell_viz_load_complete(&mut self) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let pkt: ScaiiPacket = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Module(ModuleEndpoint {
                    name: "viz".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::UserCommand(
                protos::UserCommand {
                    command_type: protos::user_command::UserCommandType::SelectFileComplete as i32,
                    args: Vec::new(),
                },
            )),
        };
        let result = self.send_pkt_to_viz(pkt)?;
        Ok(result)
    }

    fn notify_viz_that_jump_completed(&mut self) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let pkt: ScaiiPacket = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Module(ModuleEndpoint {
                    name: "viz".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::UserCommand(
                protos::UserCommand {
                    command_type: protos::user_command::UserCommandType::JumpCompleted as i32,
                    args: Vec::new(),
                },
            )),
        };
        let result = self.send_pkt_to_viz(pkt)?;
        Ok(result)
    }

    fn send_pkt_to_viz(&mut self, pkt: ScaiiPacket) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let mut to_send: Vec<protos::ScaiiPacket> = Vec::new();
        to_send.push(pkt);
        let mm = MultiMessage { packets: to_send };
        self.env.route_messages(&mm);
        self.env.update();
        let scaii_pkts: Vec<protos::ScaiiPacket> = {
            let queue = &mut *self.incoming_message_queue.borrow_mut();
            let result: Vec<protos::ScaiiPacket> = queue.incoming_messages.drain(..).collect();
            result
        };
        Ok(scaii_pkts)
    }

    fn poll_viz(&mut self) -> Result<Vec<ScaiiPacket>, Box<Error>> {
        let pkt: ScaiiPacket = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Module(ModuleEndpoint {
                    name: "viz".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::UserCommand(
                protos::UserCommand {
                    command_type: protos::user_command::UserCommandType::PollForCommands as i32,
                    args: Vec::new(),
                },
            )),
        };
        let result = self.send_pkt_to_viz(pkt)?;
        Ok(result)
    }

    fn deploy_replay_directives_to_backend(
        &mut self,
        mm: &MultiMessage,
    ) -> Result<Vec<protos::ScaiiPacket>, Box<Error>> {
        self.env.route_messages(mm);
        self.env.update();
        let scaii_pkts: Vec<protos::ScaiiPacket> = {
            let queue = &mut *self.incoming_message_queue.borrow_mut();
            let result: Vec<protos::ScaiiPacket> = queue.incoming_messages.drain(..).collect();
            result
        };
        Ok(scaii_pkts)
    }

    fn send_test_mode_jump_to_message(&mut self, target_step: &String) -> Result<(), Box<Error>> {
        let target: String = String::from("MockRts");
        let command: String = String::from("jumpTo");
        let mut args_list: Vec<String> = Vec::new();
        args_list.push(target);
        args_list.push(command);
        args_list.push(target_step.clone());
        let pkt: ScaiiPacket = self.create_test_control_message(args_list);
        self.send_pkt_to_backend(pkt)
    }

    fn send_pkt_to_backend(&mut self, pkt: ScaiiPacket) -> Result<(), Box<Error>> {
        let mut pkts: Vec<ScaiiPacket> = Vec::new();
        pkts.push(pkt);
        let mm = MultiMessage { packets: pkts };
        let scaii_pkts = self.deploy_replay_directives_to_backend(&mm)?;
        for scaii_pkt in &scaii_pkts {
            if scaii_defs::protos::is_error_pkt(scaii_pkt) {
                // Error would have already been shown to user at UI
                return Err(Box::new(ReplayError::new(&format!(
                    "Error response packet received from backend {:?}",
                    scaii_pkt
                ))));
            } else {
                return Err(Box::new(ReplayError::new(&format!(
                    "Unexpected response packet received from backend {:?}",
                    scaii_pkt
                ))));
            }
        }
        Ok(())
    }

    fn create_test_control_message(&mut self, args_list: Vec<String>) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            },
            specific_msg: Some(scaii_defs::protos::scaii_packet::SpecificMsg::TestControl(
                protos::TestControl { args: args_list },
            )),
        }
    }

    fn send_test_mode_rewind_hint_message(&mut self) -> Result<(), Box<Error>> {
        let target: String = String::from("MockRts");
        let command: String = String::from("rewind");
        let mut args_list: Vec<String> = Vec::new();
        args_list.push(target);
        args_list.push(command);
        let pkt: ScaiiPacket = self.create_test_control_message(args_list);
        self.send_pkt_to_backend(pkt)
    }

    fn send_test_mode_jump_to_hint_message(&mut self, target_index: u64) -> Result<(), Box<Error>> {
        let target: String = String::from("MockRts");
        let command: String = String::from("jump");
        let index: String = format!("{}", target_index);
        let mut args_list: Vec<String> = Vec::new();
        args_list.push(target);
        args_list.push(command);
        args_list.push(index);
        let pkt: ScaiiPacket = self.create_test_control_message(args_list);
        self.send_pkt_to_backend(pkt)
    }

    fn execute_run_step(&mut self) -> Result<GameState, Box<Error>> {
        let mut game_state: GameState = GameState::Running;
        if self.replay_sequencer.has_next() {
            let pkt = self.replay_sequencer.next();
            self.send_pkt_to_backend(pkt)?;
        } else {
            // game will automatically pause at end, switch to polling mode
            game_state = GameState::Paused;
        }
        Ok(game_state)
    }

    fn execute_poll_step(&mut self, mut game_state: GameState) -> Result<GameState, Box<Error>> {
        let scaii_pkts: Vec<ScaiiPacket> = self.poll_viz()?;
        for scaii_pkt in &scaii_pkts {
            if scaii_defs::protos::is_user_command_pkt(scaii_pkt) {
                let user_command_args: Vec<String> =
                    scaii_defs::protos::get_user_command_args(scaii_pkt);
                // we would get args here when they are relevant
                let user_command_type = scaii_defs::protos::get_user_command_type(scaii_pkt)?;
                match user_command_type {
                    UserCommandType::None => {
                        println!("================RECEIVED UserCommandType::None================");
                    }
                    UserCommandType::SelectFileComplete => {
                        // ignore, only sent to Viz
                    }
                    UserCommandType::SelectFile => {
                        println!(
                            "================RECEIVED UserCommandType::SelectFile================"
                        );
                        let filename: String = user_command_args[0].clone();
                        println!("load file {}!", filename);
                        game_state = GameState::AwaitingUserPlayRequest;
                        self.load_selected_replay_file(filename)?;
                    }
                    UserCommandType::Explain => {
                        println!(
                            "================RECEIVED UserCommandType::Explain================"
                        );
                        let step: String = user_command_args[0].clone();
                        println!("please explain action at step {}!", step);
                        self.explain_action_at_step(step)?;
                    }
                    UserCommandType::Pause => {
                        println!("================RECEIVED UserCommandType::Pause================");
                        game_state = GameState::Paused;
                    }
                    UserCommandType::Resume => {
                        game_state = GameState::Running;
                        //game_state = GameState::SingleStep;
                        println!(
                            "================RECEIVED UserCommandType::Resume================"
                        );
                    }
                    UserCommandType::Rewind => {
                        println!(
                            "================RECEIVED UserCommandType::Rewind================"
                        );

                        if self.test_mode {
                            self.send_test_mode_rewind_hint_message()?;
                        }
                        //let pkt = replay_util::get_reset_env_pkt();
                        //self.send_pkt_to_backend(pkt);

                        let emit_viz_pkt = replay_util::get_emit_viz_pkt();
                        self.send_pkt_to_backend(emit_viz_pkt)?;
                        let pkt = self.replay_sequencer.rewind();
                        println!("got rewind packet");
                        self.send_pkt_to_backend(pkt)?;
                        println!("sent rewind to backend");
                        self.reset_ui_step_position("0".to_string())?;
                        println!("sent UI to step position 0");
                    }
                    UserCommandType::PollForCommands => {
                        println!(
                            "================RECEIVED UserCommandType::PollForCommands================"
                        );
                    }
                    UserCommandType::JumpToStep => {
                        println!(
                            "================RECEIVED UserCommandType::JumpToStep================"
                        );
                        println!("args : {:?}", user_command_args);
                        let jump_target: &String = &user_command_args[0];

                        //let pkt = replay_util::get_reset_env_pkt();
                        //self.send_pkt_to_backend(pkt);
                        let emit_viz_pkt = replay_util::get_emit_viz_pkt();
                        self.send_pkt_to_backend(emit_viz_pkt)?;
                        game_state = self.handle_jump_request(jump_target)?;
                    }
                    UserCommandType::JumpCompleted => {} // sent to viz, not received from viz
                    UserCommandType::SetSpeed => {
                        println!(
                            "================RECEIVED UserCommandType::SetSpeed================"
                        );
                        let speed: &String = &user_command_args[0];

                        self.adjust_replay_speed(speed)?;
                    }
                }
            } else if scaii_defs::protos::is_error_pkt(scaii_pkt) {
                // Error would have already been shown to user at UI
            } else {
                println!(
                    "REPLAY unexpected pkt received by Viz polling {:?}",
                    scaii_pkt
                );
            }
        }
        wait(*self.poll_delay.lock().unwrap());
        Ok(game_state)
    }

    #[allow(unused_assignments)]
    fn explain_action_at_step(&mut self, step: String) -> Result<(), Box<Error>> {
        let step_int = step.parse::<u32>().unwrap();
        println!("asked to explain step {}", step_int);
        let mut expl_result: Option<ExplanationPoint> = None;
        match self.explanations_option {
            None => expl_result = None,
            Some(ref explanations) => {
                if explanations.step_indices.contains(&step_int) {
                    expl_result = explanations.expl_map.get(&step_int).cloned();
                } else {
                    expl_result = None;
                }
            }
        }
        let pkt: ScaiiPacket = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Module(ModuleEndpoint {
                    name: "viz".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::ExplDetails(ExplanationDetails {
                step: Some(step_int),
                expl_point: expl_result,
                chart: None,
            })),
        };
        let _ignored_respons_pkts = self.send_pkt_to_viz(pkt)?;
        Ok(())
    }

    fn reset_ui_step_position(&mut self, position: String) -> Result<(), Box<Error>> {
        let mut command_vec: Vec<String> = Vec::new();
        command_vec.push("set_step_position".to_string());
        command_vec.push(position);
        let pkt: ScaiiPacket = ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Module(ModuleEndpoint {
                    name: "viz".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::ReplayControl(ReplayControl {
                command: command_vec,
            })),
        };
        let _ignored_respons_pkts = self.send_pkt_to_viz(pkt)?;
        Ok(())
    }

    fn adjust_replay_speed(&mut self, speed_string: &str) -> Result<(), Box<Error>> {
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

    fn handle_jump_request(&mut self, jump_target: &String) -> Result<GameState, Box<Error>> {
        let result = jump_target.parse::<u32>();
        match result {
            Ok(jump_target_int) => {
                if self.test_mode {
                    let keyframe_index = self.replay_sequencer
                        .get_prior_key_frame_index(jump_target_int);
                    self.send_test_mode_jump_to_hint_message(keyframe_index as u64)?;
                }
                let pkts = self.replay_sequencer.jump_to(jump_target_int)?;
                let rewound_to: i32 = self.replay_sequencer.get_index_rewound_to() as i32;
                let index_for_ui_to_restart_at: i32 = rewound_to - 1;
                self.reset_ui_step_position(format!("{}", index_for_ui_to_restart_at))?;
                for pkt in pkts {
                    self.send_pkt_to_backend(pkt)?;
                }

                self.notify_viz_that_jump_completed()?;
                if self.test_mode {
                    self.send_test_mode_jump_to_message(jump_target)?;
                }
            }
            Err(_) => {
                Box::new(ReplayError::new(&format!(
                    "Jump target {} not valid number.",
                    jump_target
                )));
            }
        }

        Ok(GameState::Paused)
    }

    fn run_and_poll(&mut self) -> Result<(), Box<Error>> {
        use std::{thread, time};
        let ten_millis = time::Duration::from_millis(10);
        let mut game_state: GameState = GameState::AwaitingUserPlayRequest;

        let mut poll_timer_count = self.poll_timer_count.clone();
        let mut step_timer_count = self.step_timer_count.clone();

        // since messages to rpc (viz) block and wait for response
        // and messages to rts are synchronous as well, use single
        // thread.
        while !self.shutdown_received {
            thread::sleep(ten_millis);
            poll_timer_count = poll_timer_count - 1;
            if 0 == poll_timer_count {
                game_state = self.execute_poll_step(game_state)?;
                poll_timer_count = self.poll_timer_count.clone();
            }
            step_timer_count = step_timer_count - 1;
            if 0 == step_timer_count {
                step_timer_count = self.step_timer_count.clone();
                game_state = self.handle_step_nudge(game_state)?;
            }
        }
        Ok(())
    }

    fn handle_step_nudge(&mut self, mut game_state: GameState) -> Result<GameState, Box<Error>> {
        match game_state {
            GameState::AwaitingUserPlayRequest => {
                println!("executing first run step to get game board shown");
                game_state = self.execute_run_step()?;
                let emit_viz_pkt = replay_util::get_emit_viz_pkt();
                self.send_pkt_to_backend(emit_viz_pkt)?;
                game_state = GameState::Paused;
                self.tell_viz_load_complete()?;
            }
            GameState::Running => {
                println!("executing run step");
                game_state = self.execute_run_step()?;
            }
            GameState::Paused => {
                // do nothing
            } // GameState::SingleStep => {
              //     let _ignore_game_state = self.execute_run_step()?;
              //     game_state = GameState::Paused;
              // }
        }
        Ok(game_state)
    }
}

fn wait(milliseconds: u64) {
    let delay = time::Duration::from_millis(milliseconds);
    thread::sleep(delay);
}

#[allow(dead_code)]
enum RunMode {
    Live,
    Test,
}
fn parse_args(arguments: Vec<String>) -> Args {
    let mut args = Args {
        cmd_webserver: false,
        cmd_test: false,
        flag_data_from_recorded_file: false,
        flag_data_hardcoded: false,

        cmd_file: false,
        flag_filename: false,
        arg_path_to_replay_file: "".to_string(),
    };
    //      replay webserver
    //  replay file [--filename <path-to-replay-file>]
    //  replay test [--data-hardcoded | --data-from-recorded-file]
    //  replay (-h | --help)
    if arguments.len() < 2 {
        println!("{}", USAGE);
        std::process::exit(0);
    }
    let command = &arguments[1];
    match command.as_ref() {
        "webserver" => {
            args.cmd_webserver = true;
        }
        "file" => {
            args.cmd_file = true;
            match arguments.len() {
                2 => {
                    // no further arguments
                }
                4 => {
                    let flag = &arguments[2];
                    match flag.as_ref() {
                        "--filename" => {
                            args.flag_filename = true;
                            let path = &arguments[3];
                            args.arg_path_to_replay_file = path.clone();
                        }
                        _ => {
                            println!("{}", USAGE);
                            std::process::exit(0);
                        }
                    }
                }
                _ => {
                    println!("{}", USAGE);
                    std::process::exit(0);
                }
            }
        }
        "test" => {
            args.cmd_test = true;
            match arguments.len() {
                3 => {
                    let flag = &arguments[2];
                    match flag.as_ref() {
                        "--data-hardcoded" => {
                            args.flag_data_hardcoded = true;
                        }
                        "--data-from-recorded-file" => {
                            args.flag_data_from_recorded_file = true;
                        }
                        _ => {
                            println!("{}", USAGE);
                            std::process::exit(0);
                        }
                    }
                }
                _ => {
                    println!("{}", USAGE);
                    std::process::exit(0);
                }
            }
        }
        &_ => {
            println!("{}", USAGE);
            std::process::exit(0);
        }
    }
    args
}
fn main() {
    let result = try_main();
    match result {
        Ok(_) => {}
        Err(err) => {
            println!("ERROR: {:?}", err);
        }
    }
}
fn try_main() -> Result<(), Box<Error>> {
    let arguments: Vec<String> = env::args().collect();
    let args: Args = parse_args(arguments);
    // let args: Args = Docopt::new(USAGE)
    //     .and_then(|d| d.deserialize())
    //     .unwrap_or_else(|e| e.exit());
    if args.cmd_webserver {
        launch_webserver();
        return Ok(());
    } else if args.cmd_test {
        println!("Running Replay in test mode...");
        println!("...loading hardcoded replay data...");
        run_replay(RunMode::Test)?;
        return Ok(());
    } else if args.cmd_file {
        println!("Running Replay in live mode...");
        run_replay(RunMode::Live,)?;
        return Ok(());
    } else {
        panic!("Unrecognized command mode for replay: {:?}", args);
    }
}

#[allow(unused_assignments)]
fn run_replay(run_mode: RunMode)  -> Result<(), Box<Error>>{
    let mut mode_is_test = true;
    let mut environment: Environment = Environment::new();

    match run_mode {
        RunMode::Test => {
            configure_and_register_mock_rts(&mut environment);
        }
        RunMode::Live => {
            mode_is_test = false;
        }
    }
    let dummy_agent = DummyAgentMessageQueue {
        incoming_messages: Vec::new(),
    };
    let rc_dummy_agent = Rc::new(RefCell::new(dummy_agent));

    let replay_message_queue = ReplayMessageQueue {
        incoming_messages: Vec::new(),
    };
    let rc_replay_message_queue = Rc::new(RefCell::new(replay_message_queue));
    {
        environment
            .router_mut()
            .register_agent(Box::new(Rc::clone(&rc_dummy_agent)));
        debug_assert!(environment.router().agent().is_some());
    }
    {
        environment
            .router_mut()
            .register_replay(Box::new(Rc::clone(&rc_replay_message_queue)));
        debug_assert!(environment.router().replay().is_some());
    }
    let dummy_replay_actions : Vec<ReplayAction> = Vec::new();
    let dummy_replay_sequencer = ReplaySequencer::new(&dummy_replay_actions, true)?;
    let mut replay_manager = ReplayManager {
        incoming_message_queue: rc_replay_message_queue,
        step_delay: Arc::new(Mutex::new(201)),
        poll_delay: Arc::new(Mutex::new(50)),
        shutdown_received: false,
        env: environment,
        // pass in dummy rather than have option to simplify downstream code
        replay_sequencer: dummy_replay_sequencer,
        explanations_option: None,
        test_mode: mode_is_test,
        poll_timer_count: 5,
        step_timer_count: 10,
    };
    let result = replay_manager.start();
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(e),
    }
    
}

fn configure_and_register_mock_rts(env: &mut Environment) {
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
