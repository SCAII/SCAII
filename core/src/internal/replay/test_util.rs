use prost::Message;
use protos::endpoint::Endpoint;
use protos::scaii_packet::SpecificMsg;
use protos::{
    cfg, scaii_packet, BackendCfg, BackendEndpoint, Cfg, Entity, ModuleEndpoint, MultiMessage,
    RecorderConfig, RecorderEndpoint, ReplayEndpoint, ScaiiPacket, Viz, VizInit,
};
use scaii_core::{
    ActionWrapper, ReplayAction, ReplayHeader, SerializationInfo, SerializedProtosEndpoint,
    SerializedProtosScaiiPacket, SerializedProtosSerializationResponse,
};
use scaii_defs;
use scaii_defs::protos;
use scaii_defs::{Backend, Module};
use std::error::Error;

pub struct MockRts {
    pub viz_sequence: Vec<protos::ScaiiPacket>,
    pub outbound_messages: Vec<protos::MultiMessage>,
    pub step_count: u32,
    pub step_position: u32,
    pub sent_viz_init: bool,
}

impl MockRts {
    pub fn init_entity_sequence(&mut self) {
        let mut entities1 = generate_entity_sequence(self.step_count, "triangle", -30.0);
        let mut entities2 = generate_entity_sequence(self.step_count, "rectangle", 30.0);
        for _i in 0..self.step_count {
            let entity1 = entities1.remove(0);
            let entity2 = entities2.remove(0);
            let viz: ScaiiPacket = wrap_entities_in_viz_packet(entity1, entity2);
            self.viz_sequence.push(viz);
        }
    }

    pub fn step(&mut self) {
        let pkt_to_send = self.viz_sequence[self.step_position as usize].clone();
        self.step_position += 1;
        println!("MockRTS self.step_position now {}", self.step_position);
        let mm = super::pkt_util::wrap_packet_in_multi_message(pkt_to_send);
        self.outbound_messages.push(mm);
        ()
    }

    pub fn send_viz_init(&mut self) {
        let scaii_packet_viz_init = self.create_test_viz_init(400, 400);
        self.outbound_messages.push(MultiMessage {
            packets: vec![scaii_packet_viz_init],
        });
    }

    pub fn create_test_viz_init(&mut self, width: u32, height: u32) -> ScaiiPacket {
        ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Module(ModuleEndpoint {
                    name: "viz".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::VizInit(VizInit {
                test_mode: Some(false),
                step_count: Some(self.step_count as i64),
                gameboard_width: Some(width),
                gameboard_height: Some(height),
                explanations: Vec::new(),
                ..Default::default()
            })),
        }
    }
}

impl Backend for MockRts {}

impl Module for MockRts {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        let specific_msg = &msg.specific_msg;
        println!(" GGGGGGOT MMMMMMMESSAGE");
        match *specific_msg {
            Some(scaii_packet::SpecificMsg::SerResp(protos::SerializationResponse { .. })) => {
                println!("MOCKRTS got serRespons!");
                if !self.sent_viz_init {
                    println!("MOCKRTS sending viz init!");
                    self.send_viz_init();
                    self.sent_viz_init = true;
                }
            }
            Some(scaii_packet::SpecificMsg::ReplaySessionConfig(protos::ReplaySessionConfig {
                step_count: steps,
                explanation_steps: _,
                explanation_titles: _,
                chart_titles: _,
            })) => {
                println!("got replaySessionConfig");
                self.step_count = steps as u32;
                self.init_entity_sequence();
            }

            Some(scaii_packet::SpecificMsg::ReplayStep(protos::ReplayStep {})) => {
                if self.step_position < self.step_count {
                    println!("MOCKRTS step due to replayStep!");
                    self.step();
                }
            }
            Some(scaii_packet::SpecificMsg::Action(protos::Action { .. })) => {
                println!(
                    "MOCKRTS got action Action! step_position is {}, step_count is {}",
                    self.step_position, self.step_count
                );
                if self.step_position < self.step_count {
                    println!("MOCKRTS step due to agent Action!");
                    self.step();
                }
            }
            Some(scaii_packet::SpecificMsg::TestControl(protos::TestControl {
                args: ref command_args,
            })) => {
                println!("MOCKRTS got test control packet!");
                let target: &String = &command_args[0];
                if target == &String::from("MockRts") {
                    let command: &String = &command_args[1];
                    match &command[..] {
                        "rewind" => {
                            self.step_position = 0;
                        }
                        "jump" => {
                            let jump_target: &String = &command_args[2];
                            let result = jump_target.parse::<u32>();
                            match result {
                                Ok(jump_target_int) => {
                                    self.step_position = jump_target_int;
                                    println!("MockRTS jump target int was {}", jump_target_int);
                                }
                                Err(_) => {
                                    Box::new(super::ReplayError::new(&format!(
                                        "Jump target {} not valid number.",
                                        jump_target
                                    )));
                                }
                            };
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
        protos::merge_multi_messages(self.outbound_messages.drain(..).collect()).unwrap_or(
            MultiMessage {
                packets: Vec::new(),
            },
        )
    }
}

pub fn concoct_replay_info(
    step_count: u32,
    interval: u32,
) -> Result<Vec<ReplayAction>, Box<Error>> {
    let mut result: Vec<ReplayAction> = Vec::new();
    // add Header
    let replay_header = get_test_mode_replay_header(step_count)?;
    result.push(ReplayAction::Header(replay_header));

    for number in 0..step_count {
        if number % interval == 0 {
            let key_frame = get_test_mode_key_frame(number)?;
            result.push(key_frame);
        } else {
            let mut d_actions: Vec<i32> = Vec::new();
            d_actions.push(3);
            let protos_action = protos::Action {
                discrete_actions: d_actions,
                continuous_actions: Vec::new(),
                alternate_actions: None,
                explanation: None,
            };
            let mut serialized_protos_action_bytes: Vec<u8> = Vec::new();
            let protos_action_encode_result =
                protos_action.encode(&mut serialized_protos_action_bytes);
            match protos_action_encode_result {
                Ok(_) => {
                    let delta_1 = ReplayAction::Delta(ActionWrapper {
                        has_explanation: false,
                        step: number,
                        title: "".to_string(),
                        serialized_action: serialized_protos_action_bytes,
                    });
                    result.push(delta_1);
                }
                Err(err) => {
                    return Err(Box::new(err));
                }
            }
        }
    }
    Ok(result)
}

pub fn get_test_mode_key_frame(number: u32) -> Result<ReplayAction, Box<Error>> {
    let protos_ser_response = protos::SerializationResponse {
        serialized: Vec::new(),
        format: 1,
    };
    let mut psr_data: Vec<u8> = Vec::new();
    let _result = protos_ser_response.encode(&mut psr_data);
    let serialized_protos_ser_response = SerializedProtosSerializationResponse { data: psr_data };
    let endpoint = protos::Endpoint {
        endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
    };
    let mut ept_data: Vec<u8> = Vec::new();
    let _result = endpoint.encode(&mut ept_data);
    let serialized_protos_endpoint = SerializedProtosEndpoint { data: ept_data };
    let ser_info = SerializationInfo {
        source: serialized_protos_endpoint,
        data: serialized_protos_ser_response,
    };

    let mut d_actions: Vec<i32> = Vec::new();
    d_actions.push(3);
    let protos_action = protos::Action {
        discrete_actions: d_actions,
        continuous_actions: Vec::new(),
        alternate_actions: None,
        explanation: None,
    };
    let mut serialized_protos_action_bytes: Vec<u8> = Vec::new();
    let protos_action_encode_result = protos_action.encode(&mut serialized_protos_action_bytes);
    match protos_action_encode_result {
        Ok(_) => {
            let action_wrapper = ActionWrapper {
                has_explanation: false,
                step: number,
                title: "".to_string(),
                serialized_action: serialized_protos_action_bytes,
            };
            return Ok(ReplayAction::Keyframe(ser_info, action_wrapper));
        }
        Err(err) => {
            return Err(Box::new(err));
        }
    }
}

pub fn get_test_mode_replay_header(step_count: u32) -> Result<ReplayHeader, Box<Error>> {
    let config_packet = create_cfg_pkt(step_count);
    let mut data_vec: Vec<u8> = Vec::new();
    let result = config_packet.encode(&mut data_vec);
    match result {
        Ok(_) => {
            let spsp = SerializedProtosScaiiPacket { data: data_vec };
            // rpc is done by replay not at gameplay time so won't be in header
            // viz init will be sent by backend so not from here
            Ok(ReplayHeader { configs: spsp })
        }
        Err(err) => Err(Box::new(err)),
    }
}

pub fn create_triangle_entity_at(x: &f64, y: &f64, orient: &f64) -> Entity {
    Entity {
        id: 2,
        pos: Some(protos::Pos {
            x: Some(*x),
            y: Some(*y),
        }),
        shapes: vec![protos::Shape {
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
            rotation: *orient,
            rect: None,
            arrow: None,
            circle: None,
            kite: None,
            octagon: None,
            triangle: Some(protos::Triangle {
                base_len: Some(10.0),
            }),
            delete: false,
            tag: None,
            gradient_color: None,
        }],
        delete: false,
        ..Entity::default()
    }
}

pub fn create_rectangle_entity_at(x: &f64, y: &f64, orient: &f64) -> Entity {
    Entity {
        id: 1,
        pos: Some(protos::Pos {
            x: Some(*x),
            y: Some(*y),
        }),
        shapes: vec![protos::Shape {
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
            rotation: *orient,
            rect: Some(protos::Rect {
                width: Some(10.0),
                height: Some(10.0),
            }),
            triangle: None,
            arrow: None,
            circle: None,
            kite: None,
            octagon: None,
            delete: false,
            tag: None,
            gradient_color: None,
        }],
        delete: false,
        ..Entity::default()
    }
}

pub fn generate_entity_sequence(count: u32, shape: &str, x_displacement: f64) -> Vec<Entity> {
    let mut entities: Vec<Entity> = Vec::new();
    let mut x: f64 = 300.0 + x_displacement;
    let mut y: f64 = 300.0;
    let mut j: f64 = 0.0;
    for _i in 0..count {
        let entity = create_entity_at(&x, &y, shape, &j);
        entities.push(entity);
        x = x - 1.0;
        y = y - 1.0;
        j = j - 0.1;
    }
    entities
}

pub fn create_entity_at(x: &f64, y: &f64, shape: &str, orient: &f64) -> Entity {
    match shape {
        "rectangle" => create_rectangle_entity_at(x, y, orient),
        "triangle" => create_triangle_entity_at(x, y, orient),
        _ => create_triangle_entity_at(x, y, orient),
    }
}

fn create_cfg_pkt(step_count: u32) -> ScaiiPacket {
    let mut vec: Vec<ScaiiPacket> = Vec::new();
    let cfg = Cfg {
        which_module: Some(cfg::WhichModule::BackendCfg(BackendCfg {
            cfg_msg: Some(Vec::new()),
            is_replay_mode: true,
        })),
    };
    let cfg_packet = ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        specific_msg: Some(scaii_packet::SpecificMsg::Config(cfg)),
    };
    vec.push(cfg_packet);
    let explanation_steps: Vec<u32> = Vec::new();
    let expl_titles: Vec<String> = Vec::new();
    let chart_titles: Vec<String> = Vec::new();
    let replay_session_config_packet = ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        specific_msg: Some(scaii_packet::SpecificMsg::ReplaySessionConfig(
            protos::ReplaySessionConfig {
                step_count: step_count as i64,
                explanation_steps: explanation_steps,
                explanation_titles: expl_titles,
                chart_titles: chart_titles,
            },
        )),
    };
    vec.push(replay_session_config_packet);
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Recorder(RecorderEndpoint {})),
        },
        specific_msg: Some(scaii_packet::SpecificMsg::RecorderConfig(RecorderConfig {
            pkts: vec,
            filepath: None,
            overwrite: false,
        })),
    }
}

fn wrap_entities_in_viz_packet(entity1: Entity, entity2: Entity) -> ScaiiPacket {
    let mut entities: Vec<Entity> = Vec::new();
    entities.push(entity1);
    entities.push(entity2);
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Module(ModuleEndpoint {
                //name: "viz".to_string(),
                name: "viz".to_string(),
            })),
        },
        specific_msg: Some(SpecificMsg::Viz(Viz {
            entities: entities,
            ..Default::default()
        })),
    }
}

pub fn get_test_mode_rewind_hint_message() -> ScaiiPacket {
    let target: String = String::from("MockRts");
    let command: String = String::from("rewind");
    let mut args_list: Vec<String> = Vec::new();
    args_list.push(target);
    args_list.push(command);
    let pkt: ScaiiPacket = create_test_control_message(args_list);
    pkt
}

pub fn get_test_mode_jump_to_message(target_step: &String) -> ScaiiPacket {
    let target: String = String::from("MockRts");
    let command: String = String::from("jumpTo");
    let mut args_list: Vec<String> = Vec::new();
    args_list.push(target);
    args_list.push(command);
    args_list.push(target_step.clone());
    let pkt: ScaiiPacket = create_test_control_message(args_list);
    pkt
}

pub fn get_test_mode_jump_to_hint_message(target_index: u64) -> ScaiiPacket {
    let target: String = String::from("MockRts");
    let command: String = String::from("jump");
    let index: String = format!("{}", target_index);
    let mut args_list: Vec<String> = Vec::new();
    args_list.push(target);
    args_list.push(command);
    args_list.push(index);
    let pkt: ScaiiPacket = create_test_control_message(args_list);
    pkt
}

fn create_test_control_message(args_list: Vec<String>) -> ScaiiPacket {
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
