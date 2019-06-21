use scaii_defs::protos::{BackendEndpoint, ModuleEndpoint, MultiMessage, ScaiiPacket};
use websocket::message;
use websocket::OwnedMessage;

#[test]
fn connect_attempt() {
    use super::*;
    use scaii_defs::protos::scaii_packet;
    use std::sync::mpsc;
    use std::thread;
    let (tx, rx) = mpsc::channel();
    // start a thread that starts listening on the port
    let handle = thread::spawn(move || {
        let config = super::get_rpc_config_for_viz(None, Vec::new());
        let result = init_rpc(&config).expect("trying to init_rpc");
        match result {
            LoadedAs::Module(mut rpc_module, _) => {
                // we'll get here after the wakeup connectioncomes in
                let dummy_scaii_pkt = get_dummy_scaii_pkt();
                // send the message
                rpc_module.process_msg(&dummy_scaii_pkt).unwrap();
                let mut multi_message = rpc_module.get_messages();
                let pkt = multi_message.packets.pop().unwrap();
                if pkt.specific_msg
                    == Some(scaii_packet::SpecificMsg::VizInit(protos::VizInit {
                        test_mode: Some(false),
                        step_count: Some(100),
                        gameboard_width: Some(400),
                        gameboard_height: Some(400),
                        explanations: Vec::new(),
                        ..protos::VizInit::default()
                    }))
                {
                    tx.send(String::from("success")).unwrap();
                } else {
                    tx.send(String::from("fail")).unwrap();
                }
            }
        }
    });

    // connect to the port and send a message
    use websocket::ClientBuilder;

    let mut client = ClientBuilder::new("ws://127.0.0.1:6112")
        .unwrap()
        .connect_insecure()
        .unwrap();
    let msg = client
        .recv_message()
        .expect("Could not receive ping message from local client");
    let scaii_packet = decode_scaii_packet(msg);
    let mut pkt_vec: Vec<ScaiiPacket> = Vec::new();
    pkt_vec.push(scaii_packet);
    let multi_message = protos::MultiMessage { packets: pkt_vec };

    let buf = encode_multi_message(&multi_message);
    client.send_message(&message::Message::binary(buf)).unwrap();
    let payload = rx.recv().unwrap();
    assert!(payload == String::from("success"));
    handle.join().unwrap();
}

fn get_dummy_scaii_pkt() -> ScaiiPacket {
    use scaii_defs::protos;
    use scaii_defs::protos::{endpoint, scaii_packet};
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(endpoint::Endpoint::Backend(BackendEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(endpoint::Endpoint::Module(ModuleEndpoint {
                name: "viz".to_string(),
            })),
        },
        specific_msg: Some(scaii_packet::SpecificMsg::VizInit(protos::VizInit {
            test_mode: Some(false),
            step_count: Some(100),
            gameboard_width: Some(400),
            gameboard_height: Some(400),
            explanations: Vec::new(),
            ..protos::VizInit::default()
        })),
    }
}
fn encode_multi_message(
    //packet: &ScaiiPacket,
    multi_message: &MultiMessage,
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
