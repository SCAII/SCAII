use scaii_defs::Module;
use scaii_defs::protos::{MultiMessage, ScaiiPacket};
use scaii_defs::protos::{ModuleInit, RpcConfig};
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fmt;
use std::net::{IpAddr, SocketAddr};
//use crossbeam;
use websocket::client::sync::Client;
use websocket::stream::sync::TcpStream;

use scaii_defs::protos::endpoint::Endpoint;
use std::process::Command;
use super::LoadedAs;
use scaii_defs::protos::init_as::InitAs;
use scaii_defs::protos;
use std::thread;
use std::sync::mpsc;
use std::sync::Mutex;

#[cfg(test)]
mod test;


/// Indicates that the optional functionality requested is not
/// present on this backend.
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub struct RpcError;

impl Display for RpcError {
    fn fmt(&self, f: &mut Formatter) -> Result<(), fmt::Error> {
        f.write_str(self.description())
    }
}

impl Error for RpcError {
    fn description(&self) -> &str {
        "Problem starting RpcModule"
    }
}
unsafe impl Send for RpcError {}
// pub fn init_rpc(rpc_config: RpcConfig) -> Result<LoadedAs, Box<Error>> {
//     //let mut result = Result::Err(());
//     crossbeam::scope(|scope| {
//         let (tx, rx) = mpsc::channel();
//         scope.spawn(move || {
//             let result = startup_module(&rpc_config);
//             let mutex = Mutex::new(result);
//             tx.send(mutex).unwrap();
//             //tx.send(result).unwrap();
//         });
//         match rpc_config.command {
//             None => (()),
//             Some(command_string) => {
//                 let args = rpc_config.command_args;
//                 //for arg in args.iter() {}
//                 launch_far_end(command_string, args);
//             }
//         }
//         let mutex = rx.recv().unwrap();

//         let result = mutex.lock().unwrap();
//         //let result = rx.recv().unwrap();
//         return result;
//         //handle.join();
//     });
//     //let unused_result = Box<Result::Err(())>;
//     //let result = Err(Box::new(ffi::NulError));
//     //result
//     panic!("could not instantiate");
// }

pub fn init_rpc(rpc_config: RpcConfig) -> Result<LoadedAs, Box<Error>> {
    let (tx, rx) = mpsc::channel();
    let handle = thread::spawn(move || {
        let result = startup_module(&rpc_config);
        let mutex = Mutex::new(result);
        tx.send(mutex).unwrap();
    });
    match rpc_config.command {
        None => (()),
        Some(command_string) => {
            let args = rpc_config.command_args;
            launch_far_end(command_string, args);
        }
    }
    let mutex = rx.recv().unwrap();
    let result = mutex.lock().unwrap();
    handle.join();
    *result
    // // convert the Result<LoadedAs, Box<Error+Send>> to Result<LoadedAs, Box<Error>>
    // let result = match *result {
    //     Ok(x) => Ok(x),
    //     Err(y) => {
    //         let error_that_was_boxed = *y.get;
    //         Err(Box::new(error_that_was_boxed))
    //     }
    // };
    // result
}
fn startup_module(rpc_config: &RpcConfig) -> Result<LoadedAs, Box<Error>> {
    let client = connect(&rpc_config)?;

    let result = match rpc_config.init_as.init_as.ok_or_else::<Box<Error>, _>(|| {
        From::from("Malformed InitAs field in RpcPlugin".to_string())
    })? {
        InitAs::Module(ModuleInit { name }) => Ok(LoadedAs::Module(
            Box::new(RpcModule {
                rpc: Rpc {
                    socket_client: client,
                    inbound_messages: Vec::with_capacity(5),
                    owner: Endpoint::Module(protos::ModuleEndpoint { name: name.clone() }),
                },
            }),
            name,
        )),
        _ => unimplemented!("Still need to implement Backend match arm"),
    };
    result
}

fn launch_far_end(command: String, args: Vec<String>) {
    let cmd = &command;
    if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        let c = c.arg("/C");
        let c = c.arg(&cmd);
        for arg in args.iter() {
            c.arg(arg);
        }
        c.spawn().expect(&String::as_str(
            &format!("failed to launch command {}", &cmd),
        ))
    } else {
        let mut c = Command::new("sh");
        let c = c.arg("-c");
        let c = c.arg(&cmd);
        for arg in args.iter() {
            c.arg(arg);
        }
        c.spawn().expect(&String::as_str(
            &format!("failed to launch command {}", &cmd),
        ))
    };
}

struct Rpc {
    socket_client: Client<TcpStream>,
    inbound_messages: Vec<MultiMessage>,
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

                self.inbound_messages.push(packet);
            }
            Err(e) => {
                // Send error msg to ourselves.
                let err_packet = ScaiiPacket {
                    src: protos::Endpoint {
                        endpoint: Some(Endpoint::Core(protos::CoreEndpoint {})),
                    },
                    dest: protos::Endpoint {
                        endpoint: Some(Endpoint::Core(protos::CoreEndpoint {})),
                    },
                    specific_msg: Some(scaii_packet::SpecificMsg::Err(protos::Error {
                        fatal: None,
                        error_info: None,
                        description: format!(
                            "Could not communicate with RPC plugin: {:?}.\n Err: {}",
                            self.owner,
                            e
                        ),
                    })),
                };

                self.inbound_messages.push(MultiMessage {
                    packets: vec![err_packet],
                });
            }
        }
    }
    pub fn get_messages(&mut self) -> MultiMessage {
        use scaii_defs::protos;
        protos::merge_multi_messages(self.inbound_messages.drain(..).collect()).unwrap_or(
            MultiMessage {
                packets: Vec::new(),
            },
        )
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
    use scaii_defs::protos::MultiMessage;
    use prost::Message;
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
    use websocket::sync::Server;
    use std::str::FromStr;
    use std::time::Duration;
    use std::{u16, u32};

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
