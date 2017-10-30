extern crate scaii_core;
extern crate scaii_defs;
use scaii_core::Environment;
use scaii_defs::protos;
use protos::{endpoint, scaii_packet, AgentEndpoint, CoreEndpoint, Entity, InitAs, ModuleInit,
             MultiMessage, ScaiiPacket};
use protos::cfg::WhichModule;
use endpoint::Endpoint;
use scaii_packet::SpecificMsg;

struct Replay<'a> {
    environment: Environment,
    backend: &'a (ReplayBackend + 'a),
}

impl<'a> Replay<'a> {}

pub trait ReplayBackend {
    fn init(&mut self);
    fn start_game(&self);
}
//#[derive(Copy, Clone)]
struct StandinRTS {
    viz_sequence: Vec<protos::ScaiiPacket>,
}
impl StandinRTS {
    fn hello(&self) {
        println!("HERE I AM");
    }
    fn hello2(&mut self) {
        println!("HERE I AM2");
    }
}
impl ReplayBackend for StandinRTS {
    fn start_game(&self) {
        println!("standin RTS Game Started");
    }
    fn init(&mut self) {
        let count: i32 = 5;
        let mut entities = generate_entity_sequence(count);
        entities.reverse();
        for _i in 0..count {
            let entity = entities.pop();
            match entity {
                Some(x) => {
                    let viz: ScaiiPacket = wrap_entity_in_Viz_packet(x);
                    //let viz: ScaiiPacket = self.wrap_entity_in_Viz_packet();
                    self.viz_sequence.push(viz);
                }
                None => (),
            }
        }
    }
}
fn main() {
    let mut rts = StandinRTS {
        viz_sequence: Vec::new(),
    };
    rts.init();
    let mut replay = Replay {
        environment: Environment::new(),
        backend: &rts,
    };
    let rpc_config_pkt = create_rpc_config_message();
    let multi_message = wrap_packet_in_multi_message(rpc_config_pkt);
    replay.environment.route_messages(&multi_message);
}
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
            endpoint: Some(Endpoint::Core(protos::CoreEndpoint {})),
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
fn wrap_entity_in_Viz_packet(entity: Entity) -> ScaiiPacket {
    let mut entities: Vec<Entity> = Vec::new();
    entities.push(entity);
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(protos::BackendEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Module(protos::ModuleEndpoint {
                name: "viz".to_string(),
            })),
        },
        specific_msg: Some(SpecificMsg::Viz(protos::Viz { entities: entities })),
    }
}
fn generate_entity_sequence(count: i32) -> Vec<Entity> {
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
