use scaii_defs::protos::{MultiMessage, ScaiiPacket};
use std::sync::mpsc;
use std::thread;
use websocket::message;
use websocket::OwnedMessage;
use scaii_defs::protos;

#[test]
fn connect_attempt() {
    use super::*;
    use scaii_defs::protos::InitAs;
    use scaii_defs::protos::ModuleInit;
    use scaii_defs::protos::scaii_packet;
    let (tx, rx) = mpsc::channel();
    // start a thread that starts listening on the port
    let handle = thread::spawn(move || {
        let config = RpcConfig {
            ip: Some("127.0.0.1".to_string()),
            port: Some(6112),
            init_as: InitAs {
                init_as: Some(protos::init_as::InitAs::Module(ModuleInit {
                    name: String::from("RpcPluginModule"),
                })),
            },
            command: None,
            command_args: Vec::new(),
        };
        let result = init_rpc(config).expect("trying to init_rpc");
        match result {
            LoadedAs::Module(mut rpc_module, _) => {
                println!("RPCModule here");
                // we'll get here after the wakeup connectioncomes in
                let dummy_scaii_pkt = get_dummy_scaii_pkt();
                // send the message
                rpc_module.process_msg(&dummy_scaii_pkt).unwrap();
                let mut multi_message = rpc_module.get_messages();
                let pkt = multi_message.packets.pop().unwrap();
                if pkt.specific_msg == Some(scaii_packet::SpecificMsg::VizInit(protos::VizInit {}))
                {
                    tx.send(String::from("success")).unwrap();
                } else {
                    tx.send(String::from("fail")).unwrap();
                }
            }
            LoadedAs::Backend(_) => (),
        }
    });

    // connect to the port and send a message
    use websocket::ClientBuilder;

    let mut client = ClientBuilder::new("ws://127.0.0.1:6112")
        .unwrap()
        .connect_insecure()
        .unwrap();
    println!("connected via Client::bind");
    let msg = client
        .recv_message()
        .expect("Could not receive ping message from local client");
    println!("msg received was {:?} ", msg);
    let scaii_packet = decode_scaii_packet(msg);
    let mut pkt_vec: Vec<ScaiiPacket> = Vec::new();
    pkt_vec.push(scaii_packet);
    let multi_message = protos::MultiMessage { packets: pkt_vec };

    let buf = encode_multi_message(&multi_message);
    client.send_message(&message::Message::binary(buf)).unwrap();
    println!("sent echo message from far client");
    let payload = rx.recv().unwrap();
    assert!(payload == String::from("success"));
    handle.join().unwrap();
}

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
        specific_msg: Some(scaii_packet::SpecificMsg::VizInit(protos::VizInit {})),
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
