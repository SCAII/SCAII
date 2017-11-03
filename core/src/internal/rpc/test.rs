use std::sync::mpsc;
use std::thread;
use websocket::message;
use websocket::OwnedMessage;
use scaii_defs::protos;
use scaii_defs::{Backend, BackendSupported, Module, SerializationStyle};
use scaii_defs::protos::{scaii_packet, AgentEndpoint, BackendEndpoint, ChartActions, ChartInfo,
                         ChartValueVector, CoreEndpoint, Entity, InitAs, ModuleEndpoint,
                         ModuleInit, MultiMessage, ScaiiPacket, Viz, VizInit};
use scaii_defs::protos::cfg::WhichModule;
use scaii_defs::protos::endpoint::Endpoint;
use scaii_defs::protos::scaii_packet::SpecificMsg;

// #[test]
// fn connect_attempt() {
//     use super::*;
//     use scaii_defs::protos::InitAs;
//     use scaii_defs::protos::ModuleInit;
//     use scaii_defs::protos::scaii_packet;
//     let (tx, rx) = mpsc::channel();
//     // start a thread that starts listening on the port
//     let handle = thread::spawn(move || {
//         let config = RpcConfig {
//             ip: Some("127.0.0.1".to_string()),
//             port: Some(6112),
//             init_as: InitAs {
//                 init_as: Some(protos::init_as::InitAs::Module(ModuleInit {
//                     name: String::from("RpcPluginModule"),
//                 })),
//             },
//             command: None,
//             command_args: Vec::new(),
//         };
//         let result = init_rpc(config).expect("trying to init_rpc");
//         match result {
//             LoadedAs::Module(mut rpc_module, _) => {
//                 println!("RPCModule here");
//                 // we'll get here after the wakeup connectioncomes in
//                 let dummy_scaii_pkt = get_dummy_scaii_pkt();
//                 // send the message
//                 rpc_module.process_msg(&dummy_scaii_pkt).unwrap();
//                 let mut multi_message = rpc_module.get_messages();
//                 let pkt = multi_message.packets.pop().unwrap();
//                 if pkt.specific_msg == Some(scaii_packet::SpecificMsg::VizInit(protos::VizInit {
//                     test_mode: Some(false),
//                     step_count: Some(100),
//                     gameboard_width: Some(400),
//                     gameboard_height: Some(400),
//                     explanations: Vec::new(),
//                 })) {
//                     tx.send(String::from("success")).unwrap();
//                 } else {
//                     tx.send(String::from("fail")).unwrap();
//                 }
//             }
//             LoadedAs::Backend(_) => (),
//         }
//     });

//     // connect to the port and send a message
//     use websocket::ClientBuilder;

//     let mut client = ClientBuilder::new("ws://127.0.0.1:6112")
//         .unwrap()
//         .connect_insecure()
//         .unwrap();
//     println!("connected via Client::bind");
//     let msg = client
//         .recv_message()
//         .expect("Could not receive ping message from local client");
//     println!("msg received was {:?} ", msg);
//     let scaii_packet = decode_scaii_packet(msg);
//     let mut pkt_vec: Vec<ScaiiPacket> = Vec::new();
//     pkt_vec.push(scaii_packet);
//     let multi_message = protos::MultiMessage { packets: pkt_vec };

//     let buf = encode_multi_message(&multi_message);
//     client.send_message(&message::Message::binary(buf)).unwrap();
//     println!("sent echo message from far client");
//     let payload = rx.recv().unwrap();
//     assert!(payload == String::from("success"));
//     handle.join().unwrap();
// }

fn get_dummy_scaii_pkt() -> ScaiiPacket {
    use scaii_defs::protos;
    use scaii_defs::protos::{endpoint, scaii_packet};
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(endpoint::Endpoint::Backend(protos::BackendEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(endpoint::Endpoint::Module(protos::ModuleEndpoint {
                name: "viz".to_string(),
            })),
        },
        specific_msg: Some(scaii_packet::SpecificMsg::VizInit(protos::VizInit {
            test_mode: Some(false),
            step_count: Some(100),
            gameboard_width: Some(400),
            gameboard_height: Some(400),
            explanations: Vec::new(),
        })),
    }
}
fn encode_multi_message(
    //packet: &ScaiiPacket,
    multi_message: &MultiMessage
) -> Vec<u8> {
    use prost::Message;
    let mut buf: Vec<u8> = Vec::new();
    //packet.encode(&mut buf).expect(
    multi_message
        .encode(&mut buf)
        .expect("Could not encode SCAII packet (server error)");
    buf
}

fn decode_scaii_packet(msg: OwnedMessage) -> ScaiiPacket {
    use prost::Message;

    if let OwnedMessage::Binary(vec) = msg {
        match ScaiiPacket::decode(vec) {
            Err(err) => {
                panic!("Client send something that couldn't be decoded {}", err);
            }
            Ok(msg) => msg,
        }
    } else if let OwnedMessage::Close(dat) = msg {
        panic!("Client closed connection: {:?}", dat);
    } else {
        // 1008 = Policy Violation
        panic!("Client failed to send valid response");
    }
}


//this test launches a chrome tab so commented out so it won't run with usual tests
#[test]
fn send_chart_info() {
    use super::*;
    use scaii_defs::protos::InitAs;
    use scaii_defs::protos::ModuleInit;
    use scaii_defs::protos::scaii_packet;

    //prost_build::compile_protos(&["../common_protos/scaii.proto"], &["../common_protos"]).unwrap();
    let comm = Some(String::from(
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ));
    let mut vec: Vec<String> = Vec::new();
    vec.push(String::from(
        "file:///C:/Users/Jed%20Irvine/exact/SCAII/viz/index.html",
    ));
    let config = RpcConfig {
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
    let result = init_rpc(config).expect("trying to init_rpc");
    match result {
        LoadedAs::Module(mut rpc_module, _) => {
            println!("RPCModule here");
            // we'll get here after the wakeup connectioncomes in
            let dummy_scaii_pkt = get_dummy_scaii_pkt();
            // send the message
            println!("sending viz init message");
            rpc_module.process_msg(&dummy_scaii_pkt).unwrap();
            println!("sent viz init message");
            let mut multi_message = rpc_module.get_messages();
            let pkt = multi_message.packets.pop().unwrap();
            if pkt.specific_msg == Some(scaii_packet::SpecificMsg::VizInit(protos::VizInit {
                test_mode: Some(false),
                step_count: Some(100),
                gameboard_width: Some(400),
                gameboard_height: Some(400),
                explanations: Vec::new(),
            })) {
                println!("success - vizInit returned from far end");
            } else {
                println!("fail - non Vizinit pket returned from far end");
            }
            let x: f64 = 50.0;
            let y: f64 = 75.0;
            let entity = create_entity_at(&x, &y);
            let chartInfo = generate_chart_info();
            println!("chartInfo {:?})", chartInfo);
            let vizPkt = wrap_entity_in_viz_packet(entity, chartInfo);
            rpc_module.process_msg(&vizPkt).unwrap();
            multi_message = rpc_module.get_messages();
        }
        LoadedAs::Backend(_) => (),
    }
}
/*
message ChartInfo {
	optional string chart_title = 1;
	optional string h_axis_title = 2;
	optional string v_axis_title = 3;
	optional ChartActions actions = 4;
	repeated ChartValueVector value_vectors = 5;
}
message ChartActions {
	optional string actions_label = 1;
	repeated string action_names = 2;
}
message ChartValueVector {
	optional string label = 1;
	repeated double action_values = 2;
}
*/
fn generate_chart_info() -> ChartInfo {
    /*  The code below populates chartInfo in such a way that the following javascript 
        array-of-arrays is handed to the charting package:

        [
            ["Moves","Location_(0,1)","Location_(0,2)""],
            ["left",    0.1,            0.5]
            ["right",   0.2,            0.6]
            ["up",      0.3,            0.7]
            ["down",    0.4,            0.8]
        ]
        ... where the values under each location represent the rewards corresponding to 
        each move listed on the left. 
    */
    let mut value_vectors: Vec<ChartValueVector> = Vec::new();

    let mut values: Vec<f64> = Vec::new();
    values.push(0.1);
    values.push(0.2);
    values.push(0.3);
    values.push(0.4);

    let cvv = ChartValueVector {
        label: Some(String::from("Location_(0,1)")),
        action_values: values,
    };
    value_vectors.push(cvv);

    let mut values: Vec<f64> = Vec::new();
    values.push(0.5);
    values.push(0.6);
    values.push(0.7);
    values.push(0.8);

    let cvv = ChartValueVector {
        label: Some(String::from("Location_(0,2)")),
        action_values: values,
    };
    value_vectors.push(cvv);

    let mut move_names: Vec<String> = Vec::new();
    move_names.push(String::from("left"));
    move_names.push(String::from("right"));
    move_names.push(String::from("up"));
    move_names.push(String::from("down"));
    ChartInfo {
        chart_title: Some(String::from("chartTitle")),
        h_axis_title: Some(String::from("X axis title")),
        v_axis_title: Some(String::from("Y axis title")),
        actions: Some(ChartActions {
            actions_label: Some(String::from("Moves")),
            action_names: move_names,
        }),
        value_vectors: value_vectors,
    }
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
fn wrap_entity_in_viz_packet(entity: Entity, chartInfo: ChartInfo) -> ScaiiPacket {
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
        specific_msg: Some(SpecificMsg::Viz(Viz {
            entities: entities,
            chart: Some(chartInfo),
        })),
    }
}
