use prost::Message;
use protos::endpoint::Endpoint;
use protos::user_command::UserCommandType;
use protos::{
    scaii_packet, ExplanationPoint, ModuleEndpoint, MultiMessage, RecorderConfig, ReplayControl,
    ReplayEndpoint, ScaiiPacket,
};
use scaii_core::{Environment, ReplayAction, ReplayHeader, SerializedProtosScaiiPacket};
use scaii_defs::protos;
use std::cell::RefCell;
use std::error::Error;
use std::path::Path;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use std::{thread, time};

use super::explanations::Explanations;
use super::pkt_util;
use super::replay_sequencer::ReplaySequencer;

#[derive(Debug)]
enum GameState {
    AwaitingUserPlayRequest,
    Running,
    Paused,
}

pub struct ReplayManager {
    pub incoming_message_queue: Rc<RefCell<super::ReplayMessageQueue>>, // going to go in router
    pub step_delay: Arc<Mutex<u64>>,
    pub poll_delay: Arc<Mutex<u64>>,
    pub shutdown_received: bool,
    pub env: Environment,
    pub replay_sequencer: ReplaySequencer,
    pub explanations_option: Option<Explanations>,
    pub test_mode: bool,
    pub poll_timer_count: u32,
    pub step_timer_count: u32,
}

impl ReplayManager {
    pub fn start(&mut self) -> Result<(), Box<Error>> {
        use super::{replay_util, test_util};
        // startup viz via rpc
        let mm = pkt_util::wrap_packet_in_multi_message(pkt_util::create_rpc_config_message()?);
        self.env.route_messages(&mm);
        self.env.update();
        if self.test_mode {
            let step_count: u32 = 300;
            let interval: u32 = 5;
            let replay_actions = test_util::concoct_replay_info(step_count, interval)
                .expect("Error - problem generating test replay_info");
            let replay_sequencer = ReplaySequencer::new(&replay_actions, false)?;
            self.replay_sequencer = replay_sequencer;
        } else {
            let replay_filenames = replay_util::get_replay_filenames()?;
            let replay_choice_config = pkt_util::get_replay_choice_config_message(replay_filenames);
            let mm = pkt_util::wrap_packet_in_multi_message(replay_choice_config);
            self.env.route_messages(&mm);
            self.env.update();
        }
        self.run_and_poll()
    }

    fn load_selected_replay_file(&mut self, filename: String) -> Result<(), Box<Error>> {
        use super::{explanations, replay_util, ReplayError};
        use scaii_core;
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
        let explanation_points: Vec<ExplanationPoint> =
            explanations::extract_explanations(replay_actions, &mut r_actions_sans_explanations)?;
        let mut explanations_option = explanations::map_explanations(explanation_points)?;
        if explanations::is_empty(&explanations_option) {
            println!(
                "using specified replay file to find expl file!{:?}",
                replay_path
            );
            explanations_option =
                explanations::get_explanations_for_replay_file(PathBuf::from(replay_path.clone()))?;
        }
        self.explanations_option = explanations_option;
        replay_sequencer.print_length();
        let count = replay_sequencer.get_sequence_length();
        self.replay_sequencer = replay_sequencer;

        // pull off header and configure
        let replay_session_cfg =
            pkt_util::get_replay_configuration_message(count, &self.explanations_option);
        self.configure_as_per_header(header, replay_session_cfg)?;
        Ok(())
    }

    fn emit_cfg_packets(&mut self, cfg_pkts: Vec<ScaiiPacket>) -> Result<(), Box<Error>> {
        for pkt in &cfg_pkts {
            let pkt_to_send = pkt.clone();
            let mm = pkt_util::wrap_packet_in_multi_message(pkt_to_send);
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
        use super::ReplayError;
        match header {
            ReplayAction::Header(ReplayHeader {
                                     configs: SerializedProtosScaiiPacket { data: u8_vec },
                                 }) => {
                let pkt = ScaiiPacket::decode(u8_vec)?;
                match pkt.specific_msg {
                    Some(scaii_packet::SpecificMsg::RecorderConfig(RecorderConfig {
                                                pkts: pkt_vec, overwrite: _, filepath: _
                                                                   })) => {
                        let adjusted_cfg_pkts = pkt_util::adjust_cfg_packets(pkt_vec, replay_session_cfg_pkt_for_ui, &self.test_mode)?;
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

    fn send_pkt_to_backend(&mut self, pkt: ScaiiPacket) -> Result<(), Box<Error>> {
        use super::ReplayError;
        use scaii_defs;
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
        use super::test_util;
        use scaii_defs;
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
                            let pkt = test_util::get_test_mode_rewind_hint_message();
                            self.send_pkt_to_backend(pkt)?;
                        }
                        //let pkt = pkt_util::get_reset_env_pkt();
                        //self.send_pkt_to_backend(pkt);

                        let emit_viz_pkt = pkt_util::get_emit_viz_pkt();
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

                        //let pkt = pkt_util::get_reset_env_pkt();
                        //self.send_pkt_to_backend(pkt);
                        let emit_viz_pkt = pkt_util::get_emit_viz_pkt();
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
        use protos::ExplanationDetails;
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
        use super::{test_util, ReplayError};
        let result = jump_target.parse::<u32>();
        match result {
            Ok(jump_target_int) => {
                if self.test_mode {
                    let keyframe_index = self
                        .replay_sequencer
                        .get_prior_key_frame_index(jump_target_int);
                    let pkt = test_util::get_test_mode_jump_to_hint_message(keyframe_index as u64);
                    self.send_pkt_to_backend(pkt)?;
                }
                let pkts = self.replay_sequencer.jump_to(jump_target_int)?;
                for pkt in pkts {
                    self.send_pkt_to_backend(pkt)?;
                }
                self.reset_ui_step_position(format!("{}", jump_target_int))?;
                self.notify_viz_that_jump_completed()?;
                if self.test_mode {
                    let pkt = test_util::get_test_mode_jump_to_message(jump_target);
                    self.send_pkt_to_backend(pkt)?;
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
                let _ignored_game_state = self.execute_run_step()?;
                let emit_viz_pkt = pkt_util::get_emit_viz_pkt();
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
