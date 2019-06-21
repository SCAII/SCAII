use scaii_defs::protos::{ModuleEndpoint, ModuleInit, MultiMessage, RpcConfig, ScaiiPacket};
use scaii_defs::Module;
use std::error::Error;
use std::net::{IpAddr, SocketAddr};
use websocket::client::sync::Client;
use websocket::stream::sync::TcpStream;

use super::LoadedAs;
use scaii_defs::protos;
use scaii_defs::protos::endpoint::Endpoint;
use scaii_defs::protos::init_as::InitAs;
use std::process::{Child, Command};
use std::sync::mpsc;
use std::thread;

#[cfg(test)]
mod test;

pub fn init_rpc(rpc_config: &RpcConfig) -> Result<LoadedAs, Box<Error>> {
    let (tx, rx) = mpsc::channel();
    let command = rpc_config.command.clone();
    match command {
        None => (),
        Some(cmd) => {
            let args = rpc_config.command_args.clone();
            let _handle = thread::spawn(move || {
                launch_far_end(&cmd, &args.to_vec());
                rx.recv().unwrap();
            });
        }
    }

    let result = startup_module(rpc_config);
    tx.send(String::from("rpc_started")).unwrap();
    result
}

fn startup_module(rpc_config: &RpcConfig) -> Result<LoadedAs, Box<Error>> {
    let client = connect(rpc_config)?;
    let init_as = rpc_config.init_as.clone();
    match init_as.init_as.ok_or_else::<Box<Error>, _>(|| {
        From::from("Malformed InitAs field in RpcPlugin".to_string())
    })? {
        InitAs::Module(ModuleInit { name }) => Ok(LoadedAs::Module(
            Box::new(RpcModule {
                rpc: Rpc {
                    socket_client: client,
                    messages_from_socket_client: Vec::with_capacity(5),
                    owner: Endpoint::Module(protos::ModuleEndpoint { name: name.clone() }),
                },
            }),
            name,
        )),
        _ => unimplemented!("Still need to implement Backend match arm"),
    }
}

fn launch_far_end(command: &str, args: &[String]) -> Child {
    if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        let c = c.arg("/C");
        //let quoted_command = format!("\"{}\"", command);
        let c = c.arg(command);
        for arg in args.iter() {
            c.arg(arg);
        }
        c.spawn().expect(String::as_str(&format!(
            "failed to launch command {}",
            command
        )))
    } else if cfg!(target_os = "unix") {
        let mut c = Command::new("sh");
        let c = c.arg("-c");
        let c = c.arg(command);
        for arg in args.iter() {
            c.arg(arg);
        }
        c.spawn().expect(String::as_str(&format!(
            "failed to launch command {}",
            command
        )))
    } else {
        // assume mac
        let mut c = Command::new("sh");
        let c = c.arg("-c");
        // for mac, command plus the args come across in the command value - if we split it
        // up like we do on windows in command and arg, it doesn't work foe some reasoin ("open file:///...")
        let c = c.arg(command);
        c.spawn().expect(String::as_str(&format!(
            "failed to launch command {}",
            command
        )))
    }
}

struct Rpc {
    socket_client: Client<TcpStream>,
    messages_from_socket_client: Vec<MultiMessage>,
    owner: Endpoint,
}

impl Rpc {
    pub fn send_message(&mut self, msg: &ScaiiPacket) {
        use scaii_defs::protos;
        use scaii_defs::protos::scaii_packet;

        let result = encode_and_send_proto(&mut self.socket_client, msg);
        match result {
            Ok(()) => {
                let packet =
                    receive_and_decode_proto(&mut self.socket_client).unwrap_or_else(|e| {
                        let err_packet = ScaiiPacket {
                            src: protos::Endpoint {
                                endpoint: Some(Endpoint::Core(protos::CoreEndpoint {})),
                            },
                            dest: protos::Endpoint {
                                endpoint: Some(self.owner.clone()),
                            },
                            specific_msg: Some(scaii_packet::SpecificMsg::Err(protos::Error {
                                fatal: None,
                                error_info: None,
                                description: format!("Error decoding in core: {}", e),
                            })),
                        };

                        MultiMessage {
                            packets: vec![err_packet],
                        }
                    });

                self.messages_from_socket_client.push(packet);
            }
            Err(e) => {
                // Send error msg to ourselves.
                let err_packet = ScaiiPacket {
                    src: protos::Endpoint {
                        endpoint: Some(Endpoint::Module(ModuleEndpoint {
                            name: "viz".to_string(),
                        })),
                    },
                    dest: protos::Endpoint {
                        endpoint: Some(Endpoint::Replay(protos::ReplayEndpoint {})), //Should be replay endpoint
                    },
                    specific_msg: Some(scaii_packet::SpecificMsg::Err(protos::Error {
                        fatal: None,
                        error_info: None,
                        description: format!(
                            "Could not communicate with RPC plugin: {:?}.\n Err: {}",
                            self.owner, e
                        ),
                    })),
                };
                self.messages_from_socket_client.push(MultiMessage {
                    packets: vec![err_packet],
                });
            }
        }
    }
    pub fn get_messages(&mut self) -> MultiMessage {
        use scaii_defs::protos;
        protos::merge_multi_messages(self.messages_from_socket_client.drain(..).collect())
            .unwrap_or(MultiMessage {
                packets: Vec::new(),
            })
    }
}

struct RpcModule {
    rpc: Rpc,
}
impl Module for RpcModule {
    fn process_msg(&mut self, msg: &ScaiiPacket) -> Result<(), Box<Error>> {
        self.rpc.send_message(msg);
        Ok(()) // TODO -return something meaningful
    }

    fn get_messages(&mut self) -> MultiMessage {
        self.rpc.get_messages()
    }
}

fn receive_and_decode_proto(client: &mut Client<TcpStream>) -> Result<MultiMessage, Box<Error>> {
    use prost::Message;
    use scaii_defs::protos::MultiMessage;
    use websocket::OwnedMessage;

    let msg = client.recv_message()?;
    if let OwnedMessage::Binary(vec) = msg {
        Ok(MultiMessage::decode(vec)?)
    } else if let OwnedMessage::Close(dat) = msg {
        Err(From::from(format!("Client closed connection: {:?}", dat)))
    } else {
        Err(From::from("Client sent malformed multimessage".to_string()))
    }
}

fn encode_and_send_proto(
    client: &mut Client<TcpStream>,
    packet: &ScaiiPacket,
) -> Result<(), Box<Error>> {
    use prost::Message;
    use websocket::message;
    let mut buf: Vec<u8> = Vec::new();
    packet.encode(&mut buf)?;

    client.send_message(&message::Message::binary(buf))?;
    Ok(())
}

fn connect(settings: &RpcConfig) -> Result<Client<TcpStream>, Box<Error>> {
    use std::str::FromStr;
    use std::time::Duration;
    use std::{u16, u32};
    use websocket::sync::Server;

    let port = settings.port.unwrap();
    if port > u32::from(u16::MAX) {
        return Err(From::from(
            "Port overflows uint16, \
             protobuf does not have uint16 so it's your responsibility to \
             not attempt to bind to a port higher than that.",
        ));
    }

    let mut server = Server::bind(SocketAddr::new(
        IpAddr::from_str(settings.ip.as_ref().unwrap())?,
        port as u16,
    ))?;
    let connection = match server.accept() {
        Err(err) => return Err(Box::new(err.error)),
        Ok(connection) => connection,
    };

    connection
        .tcp_stream()
        .set_read_timeout(Some(Duration::new(500, 0)))?;

    connection
        .tcp_stream()
        .set_write_timeout(Some(Duration::new(500, 0)))?;

    match connection.accept() {
        Ok(conn) => Ok(conn),
        // Ignore the returned server since we're not
        // going to reattempt connections, just alert
        // the user of the error
        Err((_, err)) => Err(Box::new(err)),
    }
}

pub fn get_rpc_config_for_viz(comm: Option<String>, args_vec: Vec<String>) -> protos::RpcConfig {
    protos::RpcConfig {
        ip: Some("127.0.0.1".to_string()),
        port: Some(6112),
        init_as: protos::InitAs {
            init_as: Some(protos::init_as::InitAs::Module(ModuleInit {
                name: String::from("viz"),
            })),
        },
        command: comm,
        command_args: args_vec,
    }
}
