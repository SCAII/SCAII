use prost::Message;
use protos::{cfg, scaii_packet, BackendCfg, BackendEndpoint, Cfg, Entity, ModuleEndpoint,
             MultiMessage, RecorderConfig, RecorderEndpoint, ReplayEndpoint, ScaiiPacket, Viz,
             VizInit};
use protos::endpoint::Endpoint;
use scaii_core::{GameAction, ReplayAction, ReplayHeader, SerializationInfo,
                 SerializedProtosAction, SerializedProtosEndpoint, SerializedProtosScaiiPacket,
                 SerializedProtosSerializationResponse};
use scaii_defs::protos;
use protos::scaii_packet::SpecificMsg;
use scaii_defs::{Backend, BackendSupported, Module, SerializationStyle};
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
        for i in 0..self.step_count {
            let entity1 = entities1.remove(0);
            let entity2 = entities2.remove(0);
            let viz: ScaiiPacket = wrap_entities_in_viz_packet(i, entity1, entity2);
            self.viz_sequence.push(viz);
        }
    }

    pub fn step(&mut self) {
        let pkt_to_send = self.viz_sequence[self.step_position as usize].clone();
        self.step_position += 1;
        println!("MockRTS self.step_position now {}", self.step_position);
        let mm = super::wrap_packet_in_multi_message(pkt_to_send);
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
                    name: "RpcPluginModule".to_string(),
                })),
            },
            specific_msg: Some(scaii_packet::SpecificMsg::VizInit(VizInit {
                test_mode: Some(false),
                step_count: Some(self.step_count),
                gameboard_width: Some(width),
                gameboard_height: Some(height),
                explanations: Vec::new(),
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
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        let specific_msg = &msg.specific_msg;
        match *specific_msg {
            Some(scaii_packet::SpecificMsg::SerResp(protos::SerializationResponse { .. })) => {
                if !self.sent_viz_init {
                    println!("MOCKRTS sending viz init!");
                    self.send_viz_init();
                    self.sent_viz_init = true;
                }
            }
            Some(scaii_packet::SpecificMsg::ReplaySessionConfig(protos::ReplaySessionConfig {
                step_count: steps,
            })) => {
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
                if self.step_position < self.step_count {
                    println!("MOCKRTS step due to agent Action!");
                    self.step();
                }
            }
            Some(scaii_packet::SpecificMsg::TestControl(protos::TestControl {
                args: ref command_args,
            })) => {
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
    let replay_header = get_test_mode_replay_header()?;
    result.push(ReplayAction::Header(replay_header));

    for number in 0..step_count {
        if number % interval == 0 {
            let key_frame = get_test_mode_key_frame();
            result.push(key_frame);
        } else if number % interval == 1 {
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
                    let serialized_protos_action = SerializedProtosAction {
                        data: serialized_protos_action_bytes,
                    };
                    let delta_1 =
                        ReplayAction::Delta(GameAction::DecisionPoint(serialized_protos_action));
                    result.push(delta_1);
                }
                Err(err) => {
                    return Err(Box::new(err));
                }
            }
        } else {
            let delta_2 = ReplayAction::Delta(GameAction::Step);
            result.push(delta_2);
        }
    }
    Ok(result)
}

pub fn get_test_mode_key_frame() -> ReplayAction {
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
    let action = GameAction::Step;
    ReplayAction::Keyframe(ser_info, action)
}

pub fn get_test_mode_replay_header() -> Result<ReplayHeader, Box<Error>> {
    let config_packet = create_cfg_pkt();
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
                rotation: *orient,
                rect: None,
                triangle: Some(protos::Triangle {
                    base_len: Some(10.0),
                }),
                delete: false,
                tag: None,
                gradient_color: None,
            },
        ],
        delete: false,
    }
}

pub fn create_rectangle_entity_at(x: &f64, y: &f64, orient: &f64) -> Entity {
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
                rotation: *orient,
                rect: Some(protos::Rect {
                    width: Some(10.0),
                    height: Some(10.0),
                }),
                triangle: None,
                delete: false,
                tag: None,
                gradient_color: None,
            },
        ],
        delete: false,
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

fn create_cfg_pkt() -> ScaiiPacket {
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

fn wrap_entities_in_viz_packet(step: u32, entity1: Entity, entity2: Entity) -> ScaiiPacket {
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
                name: "RpcPluginModule".to_string(),
            })),
        },
        specific_msg: Some(SpecificMsg::Viz(Viz {
            entities: entities,
            chart: None,
            step: Some(step),
        })),
    }
}