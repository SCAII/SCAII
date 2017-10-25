use super::*;
use FUZZY_EQ_THRESH;

use websocket::client::sync::Client;
use websocket::stream::sync::TcpStream;
use scaii_defs::protos::ScaiiPacket;
#[test]
fn test_to_from_proto() {
    use rand;
    let entity = IdEntity::rand_new(0, &mut rand::thread_rng());

    let proto = entity.to_proto();

    match IdEntity::from_proto(&proto) {
        Err(err) => panic!(
            "Could not decode proto just created: {}. Proto: {:?}",
            err,
            proto
        ),
        Ok(got) => assert!(entity.fuzzy_eq(&got, FUZZY_EQ_THRESH)),
    }
}
// THIS TEST SHOULD NOT BE DELETED - COMMENTED OUT UNTIL I ADD BROWSER HANDLING
// #[test]
// fn test_viz_test_flag_off() {
//     use super::super::*;
//     use std::net::IpAddr;
//     use std::net::Ipv4Addr;

//     let settings = Settings {
//         ip: IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)),
//         port: 6112,
//         rand: Default::default(),
//     };
//     let settings = &settings;
//     use rand::XorShiftRng;

//     println!("INFO: using following rng seed: {:?}", settings.rand.seed);
//     let mut rng = XorShiftRng::from_seed(settings.rand.seed);

//     let mut client = connect(&settings);
//     println!("Sending a VizInit ScaiiPacket");

//     let viz_init = make_viz_init(false);
//     encode_and_send_proto(&mut client, &viz_init).expect("Could not send VizInit message");
//     let _echoed_viz_init = receive_and_decode_proto(&mut client);
//     println!("received echoed VizInit ScaiiPacket");

//     let init_entities = gen_entities(&mut rng);
//     let mut entity_map = first_delta(&mut client, init_entities, false);
//     test_test_mode_disabled(&mut client, &mut entity_map, &mut rng);
//     ()
// }
// fn test_test_mode_disabled<R: Rng>(
//     client: &mut Client<TcpStream>,
//     entity_map: &mut HashMap<usize, IdEntity>,
//     rng: &mut R,
// ) {
//     use websocket::message::Message;
//     use super::super::*;

//     // 9 and 19 since our initial message was our first one, and we guarantee
//     // between 10 and 20 updates
//     let loop_bounds = rng.gen_range(9, 19);

//     for i in 0..loop_bounds {
//         let update = update_entities(entity_map, rng);
//         encode_and_send_proto(client, &update).expect(&format!(
//             "Could not encode and send proto in main loop on iteration {}",
//             i
//         ));

//         let response = receive_and_decode_proto(client);
//         verify_ack_packet(client, &response);
//     }

//     client
//         .send_message(&Message::close_because(
//             1000,
//             "You passed the test! Goodbye.",
//         ))
//         .expect("Could not send success close message");
// }

// fn verify_ack_packet(client: &mut Client<TcpStream>, packet: &ScaiiPacket) {
//     use scaii_defs::protos::{endpoint, UserCommandType};
//     use websocket::message::Message;

//     let expected_src = protos::Endpoint {
//         endpoint: Some(endpoint::Endpoint::Module(protos::ModuleEndpoint {
//             name: "viz".to_string(),
//         })),
//     };
//     let expected_dest = protos::Endpoint {
//         endpoint: Some(endpoint::Endpoint::Backend(protos::BackendEndpoint {})),
//     };

//     if packet.src != expected_src {
//         client
//             .send_message(&Message::close_because(
//                 1008,
//                 "Source field should be Module{name=viz}",
//             ))
//             .expect("Could not send error closure");
//         panic!(
//             "Client sent packet with malformed src field, got {:?}, expected {:?}",
//             packet.src,
//             expected_src
//         );
//     }

//     if packet.dest != expected_dest {
//         client
//             .send_message(&Message::close_because(
//                 1008,
//                 "Dest field should be backend",
//             ))
//             .expect("Could not send error closure");
//         panic!(
//             "Client sent packet with malformed dest field, got {:?}, expected {:?}",
//             packet.dest,
//             expected_dest
//         );
//     }
//     //Message::Hello { id: id @ 3...7 }
//     use scaii_defs::protos::scaii_packet::SpecificMsg::UserCommand;
//     println!("specific message {:?}", packet.specific_msg);

//     let command_type_none_as_i32 = UserCommandType::None as i32;
//     match packet.specific_msg {
//         Some(UserCommand(ref user_command)) => {
//             if user_command.user_command_type == command_type_none_as_i32 {
//                 println!("got expected NONE command back from viz");
//                 assert!(true);
//             } else {
//                 println!("got unexpected command back from viz");
//                 assert!(false);
//             }
//         }
//         _ => {
//             println!(
//                 "ERROR should have received UserCommand.user_command_type of None back from viz"
//             );
//             assert!(false);
//         }
//     }
}
