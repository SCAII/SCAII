extern crate scaii_core;
extern crate scaii_defs;
use scaii_core::Environment;
use scaii_defs::protos;
use scaii_defs::{Backend, BackendSupported, Module, SerializationStyle};
use protos::{scaii_packet, AgentEndpoint, CoreEndpoint, Entity, InitAs, ModuleInit,
             MultiMessage, ScaiiPacket, BackendEndpoint, ModuleEndpoint, Viz, VizInit};
//use protos::BackendInit;
use protos::cfg::WhichModule;
use protos::endpoint::Endpoint;
use protos::scaii_packet::SpecificMsg;
use std::error::Error;

// The testing mode for Replay follows the following dynamic:
//      - startup an environment
//      - send RpcConfig message to start up Viz
//      - start loop that asks MockRts for next Viz pkt, but obeying user commands
//          to pause, jump, explain
//
//  The live mode for Replay follows the following dynamic:
//      - startup an environment
//      - load cfg messages from replay file and send them to core
//      - send RpcConfig message to start up Viz
//
//      - start loop that sends KeyFrame, Actions to RTS, but obeying user commands
//          to pause, jump, explain

//struct Replay<'a> {
struct Replay {
    environment: Environment,
//    backend: &'a (ReplayBackend + 'a),
}

//impl<'a> Replay<'a> {}

// pub trait ReplayBackend {
//     fn init(&mut self);
//     fn start_game(&self);
// }
//#[derive(Copy, Clone)]
struct MockRts {
    viz_sequence: Vec<protos::ScaiiPacket>,
    incoming_messages: Vec<protos::ScaiiPacket>
}
impl MockRts {
    fn init(&mut self, count:u32) {
        let mut entities = generate_entity_sequence(count);
        entities.reverse();
        for _i in 0..count {
            let entity = entities.pop();
            match entity {
                Some(x) => {
                    let viz: ScaiiPacket = wrap_entity_in_viz_packet(x);
                    self.viz_sequence.push(viz);
                }
                None => (),
            }
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
         self.incoming_messages.push(msg.clone());
         Ok(())
    }

    /// return empty messages.
    fn get_messages(&mut self) -> MultiMessage{
        let mut pkts: Vec<ScaiiPacket> = Vec::new();
        MultiMessage { packets: pkts }
    }
}
fn replay_live_mode() {
    // stubbed out for now
}
fn replay_test_mode() {
    use std::rc::Rc;
    use std::cell::RefCell;

    let mut rts = MockRts {
        viz_sequence: Vec::new(),
        incoming_messages: Vec::new(),
    };
    let count: u32= 5;
    rts.init(count);
    let mut replay = Replay {
        environment: Environment::new(),
    };
    // register backend
    //let mut rts = Rc::new(RefCell::new(rts));
    let rts = Rc::new(RefCell::new(rts));
    replay.environment.router_mut().register_backend(Box::new(rts.clone()));
    // start up viz
    let rpc_config_pkt = create_rpc_config_message();
    let mut multi_message = wrap_packet_in_multi_message(rpc_config_pkt);
    replay.environment.route_messages(&multi_message);
    println!("sent viz startup message!");
    // create viz init message
    let viz_init = create_test_viz_init(count, 800, 800);
    multi_message = wrap_packet_in_multi_message(viz_init);
    replay.environment.route_messages(&multi_message);
    println!("sent VizInit message!");
    // loop and send Viz
    let mut more_remaining : bool = true;
    while more_remaining {
        let mut_borrowed_rts = &mut *rts.borrow_mut();
        let pkt_to_send = mut_borrowed_rts.viz_sequence.pop();
        match pkt_to_send {
            Some(p) => {
                multi_message = wrap_packet_in_multi_message(p);
                replay.environment.route_messages(&multi_message);
                println!("sent Viz message!");
                replay.environment.update();
                println!("called replay.environment.update()...");
                let msgs : Vec<protos::ScaiiPacket> = { 
                    //let mut rts = &mut *rts.borrow_mut();
                    //rts.incoming_messages.drain(..).collect()
                    mut_borrowed_rts.incoming_messages.drain(..).collect()
                };
                println!("message count returned {}", msgs.len());
                // handle messages, do updates,etc
            }
            None => ()
        }
        if mut_borrowed_rts.viz_sequence.len() > 0 {
            more_remaining = false;
        }
    }
}
fn create_test_viz_init(step_count: u32, width: u32, height: u32) -> ScaiiPacket {
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            //endpoint: Some(Endpoint::Agent(AgentEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Module(ModuleEndpoint {
                name: "viz".to_string(),
            })),
        },
        specific_msg: Some(scaii_packet::SpecificMsg::VizInit(VizInit {
            test_mode: Some(false),
            step_count: Some(step_count),
            gameboard_width: Some(width),
            gameboard_height: Some(height),
            explanations : Vec::new(),
        })),
    }
}
// fn create_agent_cfg_message() -> ScaiiPacket {
//     ScaiiPacket {
//         src: protos::Endpoint {
//             endpoint: Some(Endpoint::Agent(AgentEndpoint {})),
//         },
//         dest: protos::Endpoint {
//             endpoint: Some(Endpoint::Core(CoreEndpoint {})),
//         },
//         specific_msg: Some(SpecificMsg::Config(protos::Cfg {
//             which_module: Some(WhichModule::AgentCfg(protos::AgentCfg {
//                 cfg_msg: None,
//                 },
//             )),
//         })),
//     }
// }
// fn create_backend_cfg_message() -> ScaiiPacket {
//     let rust_ffi_config = protos::RustFfiConfig {
//         plugin_path: "?".to_string(),
//         init_as: InitAs {
//             init_as: Some(protos::init_as::InitAs::Backend(BackendInit {})),
//         },
//     };

//     ScaiiPacket {
//         src: protos::Endpoint {
//             endpoint: Some(Endpoint::Agent(AgentEndpoint {})),
//         },
//         dest: protos::Endpoint {
//             endpoint: Some(Endpoint::Core(CoreEndpoint {})),
//         },
//         specific_msg: Some(SpecificMsg::Config(protos::Cfg {
//             which_module: Some(WhichModule::CoreCfg(protos::CoreCfg {
//                 plugin_type: protos::PluginType {
//                     plugin_type: Some(protos::plugin_type::PluginType::RustPlugin(rust_ffi_config)),
//                 },
//             })),
//         })),
//     }
// }
fn wrap_packet_in_multi_message(pkt: ScaiiPacket) -> MultiMessage {
    let mut pkts: Vec<ScaiiPacket> = Vec::new();
    pkts.push(pkt);
    MultiMessage { packets: pkts }
}
fn create_rpc_config_message() -> ScaiiPacket {
    let comm = Some(String::from(
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ));
    let mut vec: Vec<String> = Vec::new();
    vec.push(String::from(
        "file:///C:/Users/Jed%20Irvine/exact/SCAII/viz/index.html",
    ));
    let rpc_config = protos::RpcConfig {
        ip: Some("127.0.0.1".to_string()),
        port: Some(6112),
        init_as: InitAs {
            init_as: Some(protos::init_as::InitAs::Module(ModuleInit {
                name: String::from("RpcPluginModule"),
            })),
        },
        command: comm,
        command_args: vec,
    };

    ScaiiPacket {
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
    }
}
fn wrap_entity_in_viz_packet(entity: Entity) -> ScaiiPacket {
    let mut entities: Vec<Entity> = Vec::new();
    entities.push(entity);
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Module(ModuleEndpoint {
                name: "viz".to_string(),
            })),
        },
        specific_msg: Some(SpecificMsg::Viz(Viz { entities: entities })),
    }
}
fn generate_entity_sequence(count: u32) -> Vec<Entity> {
    let mut entities: Vec<Entity> = Vec::new();
    let mut x: f64 = 70.0;
    let mut y: f64 = 300.0;
    for _i in 0..count {
        let entity = create_entity_at(&x, &y);
        entities.push(entity);
        x = x + 2.0;
        y = y - 2.0;
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
fn main() {
    let test_mode = true;
    if test_mode {
        replay_test_mode();
    } else {
        replay_live_mode();
    }
}
