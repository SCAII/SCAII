extern crate prost;
extern crate rand;
extern crate scaii_defs;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate toml;
extern crate websocket;

use std::net::{IpAddr, SocketAddr, ToSocketAddrs};
use std::default::Default;
use std::env::Args;
use std::option::IntoIter;
use std::io;
use std::collections::HashMap;
use std::error::Error;

use rand::{Rng, SeedableRng};

use scaii_defs::protos::ScaiiPacket;
use scaii_defs::protos;

use websocket::client::sync::Client;
use websocket::stream::sync::TcpStream;

#[cfg(test)]
mod test;

pub mod entity;
use entity::*;

const FUZZY_EQ_THRESH: f32 = 1e-4;

#[derive(Serialize, Deserialize, Eq, PartialEq, Hash, Debug)]
struct RandInit {
    seed: [u32; 4],
}

impl Default for RandInit {
    fn default() -> Self {
        use rand;
        RandInit {
            seed: rand::thread_rng().gen(),
        }
    }
}

#[derive(Serialize, Deserialize, Eq, PartialEq, Hash, Debug)]
#[serde(default)]
struct Settings {
    ip: IpAddr,
    port: u16,
    rand: RandInit,
}

impl Settings {
    fn from_args(args: Args) -> Self {
        use std::fs::File;
        use std::io::{BufReader, Read};
        use toml;

        if let Some(path) = args.skip(1).next() {
            let mut reader =
                BufReader::new(File::open(&path).expect("Could not open provided toml file path"));
            let mut toml_str = String::new();
            reader
                .read_to_string(&mut toml_str)
                .expect("Could not read file as text");

            toml::from_str(&toml_str).expect("Could not parse provided toml file")
        } else {
            println!("No settings file input, using defaults");
            println!("For reference, default port and IP is 127.0.0.1:6112");

            Default::default()
        }
    }
}

impl Default for Settings {
    fn default() -> Self {
        use std::net::Ipv4Addr;

        Settings {
            ip: IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)),
            port: 6112,
            rand: Default::default(),
        }
    }
}

impl ToSocketAddrs for Settings {
    type Iter = IntoIter<SocketAddr>;

    fn to_socket_addrs(&self) -> io::Result<Self::Iter> {
        SocketAddr::new(self.ip, self.port).to_socket_addrs()
    }
}

fn connect(settings: &Settings) -> Client<TcpStream> {
    use websocket::sync::Server;
    use std::time::Duration;
    let mut server = Server::bind(settings).expect("Could not bind server to provided ip/port");
    // For some reason, we can't use expect here because apparently the result doesn't implement
    // the Debug trait?
    let connection = match server.accept() {
        Err(err) => panic!(err),
        Ok(connection) => connection,
    };

    /* Set timeouts to 5 seconds. Fine for tests, in core
    we'll probably make this configurable */
    connection
        .tcp_stream()
        .set_read_timeout(Some(Duration::new(5, 0)))
        .expect("Could not change read timeout on socket");

    connection
        .tcp_stream()
        .set_write_timeout(Some(Duration::new(5, 0)))
        .expect("Could not change write timeout on socket");

    println!("Connection accepted\n");
    println!("Sending a VizInit message");
    println!(
        "Protocol: We'll send you a ScaiiPacket delta, you apply it and send us your entity info \
         (one ScaiiPacket in a MultiMessage).\n\
         Connection will be closed after a random number of ticks between 10 and 20, or with an\
         error message on desynchronization or incorrect response."
    );
    connection.accept().expect("Couldn't accept the connection")
}

fn make_viz_init() -> ScaiiPacket {
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

fn encode_and_send_proto(
    client: &mut Client<TcpStream>,
    packet: &ScaiiPacket,
) -> Result<(), Box<Error>> {
    use prost::Message;
    use websocket::message;
    let mut buf: Vec<u8> = Vec::new();
    packet
        .encode(&mut buf)
        .expect("Could not encode SCAII packet (server error)");

    client.send_message(&message::Message::binary(buf))?;
    Ok(())
}

fn verify_scaii_packet(
    client: &mut Client<TcpStream>,
    entities: &HashMap<usize, IdEntity>,
    packet: &ScaiiPacket,
) {
    use scaii_defs::protos::{endpoint, scaii_packet};
    use websocket::message::Message;

    let expected_src = protos::Endpoint {
        endpoint: Some(endpoint::Endpoint::Module(protos::ModuleEndpoint {
            name: "viz".to_string(),
        })),
    };
    let expected_dest = protos::Endpoint {
        endpoint: Some(endpoint::Endpoint::Backend(protos::BackendEndpoint {})),
    };

    if packet.src != expected_src {
        client
            .send_message(&Message::close_because(
                1008,
                "Source field should be Module{name=viz}",
            ))
            .expect("Could not send error closure");
        panic!(
            "Client sent packet with malformed src field, got {:?}, expected {:?}",
            packet.src,
            expected_src
        );
    }

    if packet.dest != expected_dest {
        client
            .send_message(&Message::close_because(
                1008,
                "Dest field should be backend",
            ))
            .expect("Could not send error closure");
        panic!(
            "Client sent packet with malformed dest field, got {:?}, expected {:?}",
            packet.dest,
            expected_dest
        );
    }

    if let Some(scaii_packet::SpecificMsg::Viz(ref viz)) = packet.specific_msg {
        // Have to collect here instead of using as iterator
        // So we release the mutable borrow of client
        let received: Vec<_> = viz.entities
            .iter()
            .map(|entity| match IdEntity::from_proto(entity) {
                Err(err) => {
                    let err_msg = format!("Error decoding entities, expected FULL data: {}", err);
                    client
                        .send_message(&Message::close_because(1008, err_msg.clone()))
                        .expect("Could not send error closure");
                    panic!(err_msg);
                }
                Ok(entity) => entity,
            })
            .collect();

        for entity in received {
            if let Some(original) = entities.get(&entity.id) {
                if !original.fuzzy_eq(&entity, FUZZY_EQ_THRESH) {
                    let err_msg = format!(
                        "Entity with id {} does not match reference entity on server.\n\
                         Got: {:?}, Expected: {:?}\n\
                         (NOTE: Floating point tolerance is: {}",
                        entity.id,
                        entity,
                        original,
                        FUZZY_EQ_THRESH
                    );

                    client
                        .send_message(&Message::close_because(1008, err_msg.clone()))
                        .expect("Could not send error closure");
                    panic!(err_msg);
                }
            } else {
                client
                    .send_message(&Message::close_because(
                        1008,
                        "Sent an entity with an invalid ID",
                    ))
                    .expect("Could not send error closure");
                panic!("Client entity with unknown id. Got: {}", entity.id);
            }
        }
    } else {
        client
            .send_message(&Message::close_because(
                1008,
                "Specific message should be a Viz message listing FULL entity data",
            ))
            .expect("Could not send error closure");
        panic!(
            "Client sent packet with malformed specific_msg field, got {:?}, expected a Viz msg",
            packet.dest
        );
    }
}

fn receive_and_decode_proto(client: &mut Client<TcpStream>) -> ScaiiPacket {
    use scaii_defs::protos::MultiMessage;
    use prost::Message;
    use websocket::OwnedMessage;
    use websocket::message;

    let msg = client
        .recv_message()
        .expect("Could not receive message from client");
    if let OwnedMessage::Binary(vec) = msg {
        let mut msg = match MultiMessage::decode(vec) {
            Err(err) => {
                client
                    .send_message(&message::Message::close_because(
                        1008,
                        "Malformed MultiMessage",
                    ))
                    .expect("Could not send error closure");
                panic!("Client send something that couldn't be decoded {}", err);
            }
            Ok(msg) => msg,
        };

        if msg.packets.len() != 1 {
            client
                .send_message(&message::Message::close_because(
                    1008,
                    "Expected exactly 1 ScaiiPacket for this exchange",
                ))
                .expect("Could not send error closure");

            panic!("Client send the wrong number of ScaiiPackets");
        }

        msg.packets.pop().unwrap()
    } else if let OwnedMessage::Close(dat) = msg {
        panic!("Client closed connection: {:?}", dat);
    } else {
        // 1008 = Policy Violation
        client
            .send_message(&message::Message::close_because(
                1008,
                "Incorrect message type,\
                 expected binary that resolves to a MultiMessage",
            ))
            .expect("Could not send error closure");

        panic!("Client failed to send valid response");
    }
}

fn server_startup(client: &mut Client<TcpStream>) {
    println!("Sending a VizInit ScaiiPacket, no response expected");

    let viz_init = make_viz_init();
    encode_and_send_proto(client, &viz_init).expect("Could not send VizInit message");
}

fn packet_from_entity_list(entities: Vec<protos::Entity>) -> ScaiiPacket {
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

        specific_msg: Some(scaii_packet::SpecificMsg::Viz(
            protos::Viz { entities: entities },
        )),
    }
}

fn first_delta(
    client: &mut Client<TcpStream>,
    entities: Vec<IdEntity>,
) -> HashMap<usize, IdEntity> {
    let protos = entities.iter().map(|e| e.to_proto()).collect();
    println!("Sending first volley of entities to initialize list");
    encode_and_send_proto(client, &packet_from_entity_list(protos))
        .expect("Could not send initial entity list");

    let response = receive_and_decode_proto(client);

    let entity_map = entities
        .into_iter()
        .map(|entity| (entity.id, entity))
        .collect();

    verify_scaii_packet(client, &entity_map, &response);

    entity_map
}

fn min(x: usize, y: usize) -> usize {
    if x < y {
        x
    } else {
        y
    }
}

fn max(x: usize, y: usize) -> usize {
    if x > y {
        x
    } else {
        y
    }
}

// Updates entities randomly and composes a delta message
fn update_entities<R: Rng>(entity_map: &mut HashMap<usize, IdEntity>, rng: &mut R) -> ScaiiPacket {
    use rand;

    use scaii_defs::protos::{endpoint, scaii_packet};

    // Clone instead of count so we don't double dip updates (create and move in the same frame)
    let remaining_ids: Vec<usize> = entity_map.keys().cloned().collect();
    let num_updates = min(
        remaining_ids.len(),
        rng.gen_range(5, max(remaining_ids.len() / 2, 5)),
    );

    let mut entity_protos = Vec::with_capacity(num_updates);
    if remaining_ids.len() < 5 {
        let to_gen = rng.gen_range(2, 5);
        entity_protos.reserve(to_gen);

        for _ in 0..to_gen {
            let mut id = rng.gen();
            while entity_map.get(&id).is_some() {
                id = rng.gen();
            }
            let new_entity = IdEntity::rand_new(id, rng);
            let proto = new_entity.to_proto();
            entity_protos.push(proto);
            entity_map.insert(id, new_entity);
        }
    }

    let update_ids = rand::sample(rng, remaining_ids.into_iter(), num_updates);

    for id in update_ids {
        entity_protos.push(EntityUpdate::apply_and_make_proto(entity_map, id, rng));
    }

    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(endpoint::Endpoint::Backend(protos::BackendEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(endpoint::Endpoint::Module(protos::ModuleEndpoint {
                name: "viz".to_string(),
            })),
        },
        specific_msg: Some(scaii_packet::SpecificMsg::Viz(protos::Viz {
            entities: entity_protos,
        })),
    }
}

fn test_loop<R: Rng>(
    client: &mut Client<TcpStream>,
    entity_map: &mut HashMap<usize, IdEntity>,
    rng: &mut R,
) {
    use websocket::message::Message;

    // 9 and 19 since our initial message was our first one, and we guarantee
    // between 10 and 20 updates
    let loop_bounds = rng.gen_range(9, 19);

    for i in 0..loop_bounds {
        let update = update_entities(entity_map, rng);
        encode_and_send_proto(client, &update).expect(&format!(
            "Could not encode and send proto in main loop on iteration {}",
            i
        ));

        let response = receive_and_decode_proto(client);
        verify_scaii_packet(client, entity_map, &response);
    }

    client
        .send_message(&Message::close_because(
            1000,
            "You passed the test! Goodbye.",
        ))
        .expect("Could not send success close message");
}

fn test_viz_client(settings: Settings) {
    use rand::XorShiftRng;

    println!("INFO: using following rng seed: {:?}", settings.rand.seed);
    let mut rng = XorShiftRng::from_seed(settings.rand.seed);

    let mut client = connect(&settings);
    server_startup(&mut client);

    let init_entities = gen_entities(&mut rng);
    let mut entity_map = first_delta(&mut client, init_entities);
    test_loop(&mut client, &mut entity_map, &mut rng);
}

fn main() {
    use std::env;
    test_viz_client(Settings::from_args(env::args()));
}
