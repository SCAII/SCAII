extern crate libloading;
extern crate prost;
extern crate libc;
extern crate scaii_defs;
#[macro_use]
extern crate lazy_static;

use scaii_defs::protos::{MultiMessage, ScaiiPacket, AgentEndpoint};
use prost::Message;
use std::error::Error;

use libc::{c_uchar, size_t};


// Don't publicly expose our internal structure to FFI
pub(crate) mod internal;

use internal::router::Router;

/// The Environment created by this library.
pub struct Environment {
    router: internal::router::Router,
    next_msg: Option<MultiMessage>,
}

const FATAL_OWNER_ERROR: &'static str = "FATAL CORE ERROR: Cannot forward message to owner";

impl Environment {
    /// Processes all messages returned by module message processing routed to
    /// "core"
    fn process_core_messages(&mut self, packets: Vec<ScaiiPacket>) {
        use scaii_defs::protos::scaii_packet::SpecificMsg;
        use scaii_defs::protos::{Cfg, CoreCfg, PluginType};
        use scaii_defs::protos::cfg::WhichModule;

        for packet in packets {
            if packet.specific_msg.is_none() {
                self.handle_errors_possible_failure(
                    &packet,
                    "Specific Message field has invalid variant",
                );
            }

            match packet.specific_msg.clone().unwrap() {
                SpecificMsg::Err(_) => self.forward_err_to_owner(&mut packet.clone()),
                SpecificMsg::Config(Cfg {
                           which_module: Some(WhichModule::CoreCfg(CoreCfg { plugin_type: PluginType{ plugin_type: Some(ref mut plugin_type) } })),
                       }) => {
                           let res = self.load_cfg(plugin_type);
                           if let Err(err) = res {
                               self.handle_errors_possible_failure(&packet, &format!("Could not complete configuration: {}",err));
                           }
                       }
                SpecificMsg::Config(Cfg { which_module: Some(_) }) => {
                    self.handle_errors_possible_failure(
                        &packet,
                        "Core only handles correctly formed CoreCfg config messages.",
                    )
                }
                _ => {
                    self.handle_errors_possible_failure(&packet, "Message type not suited for Core")
                }
            }
        }
    }

    fn load_cfg(
        &mut self,
        plugin_type: &mut scaii_defs::protos::plugin_type::PluginType,
    ) -> Result<(), Box<Error>> {
        use scaii_defs::protos::plugin_type::PluginType::*;
        use internal::rust_ffi;
        use internal::rust_ffi::LoadedAs;

        match *plugin_type {
            RustPlugin(ref cfg) => {
                match rust_ffi::init_ffi(cfg.clone())? {
                    LoadedAs::Backend(backend) => {
                        let prev = self.router.register_backend(backend);
                        if prev.is_some() {
                            Err("Backend previously registered, overwriting".to_string())?
                        } else {
                            Ok(())
                        }
                    }
                    LoadedAs::Module(module, name) => {
                        let prev = self.router.register_module(name.clone(), module);
                        if prev.is_some() {
                            Err(format!(
                                "Module {} previously registered, overwriting",
                                name
                            ))?
                        } else {
                            Ok(())
                        }
                    }
                }
            }
        }
    }

    /// Handles error forwarding. First it tries the module the packet originated from,
    /// and if it can't get a hold of that it tries the owner.
    /// Otherwise, it panics because something very bad has happened.
    fn handle_errors_possible_failure(&mut self, packet: &ScaiiPacket, descrip: &str) {
        use scaii_defs::protos::endpoint::Endpoint;
        use scaii_defs::protos::CoreEndpoint;

        let error_src = packet.src.endpoint.as_ref().unwrap();
        let res = self.router.send_error(
            descrip,
            error_src,
            &Endpoint::Core(CoreEndpoint {}),
        );

        if let Err(err) = res {
            self.router
                .send_error(
                    &format!(
                        "{};\n\
                        The module who made this mistake no longer exists: {}",
                        descrip,
                        err
                    ),
                    &error_src,
                    &Endpoint::Core(CoreEndpoint {}),
                )
                .expect(FATAL_OWNER_ERROR);
            return;
        }
    }

    /// Forwards an error to the owner of this environment,
    /// panicking on failure because something has gone very wrong.
    fn forward_err_to_owner(&mut self, packet: &mut ScaiiPacket) {
        use scaii_defs::protos::endpoint;
        use scaii_defs::protos;

        let dest = protos::Endpoint { endpoint: Some(endpoint::Endpoint::Agent(AgentEndpoint {})) };
        packet.dest = dest;
        self.router.route_to(&packet).expect(FATAL_OWNER_ERROR);
    }
}


/// Creates a clean environment, further configuration is done via sending
/// `CoreCfg` messages.
#[no_mangle]
pub extern "C" fn new_environment() -> *mut Environment {
    let agent = internal::agent::PublisherAgent::new();
    let env = Box::new(Environment {
        router: Router::from_agent(Box::new(agent)),
        next_msg: None,
    });

    Box::into_raw(env)
}

/// Destroys the created environment, this should be called to avoid memory leaks.
#[no_mangle]
pub extern "C" fn destroy_environment(env: *mut Environment) {
    unsafe {
        Box::from_raw(env);
    }
}

/// Receives the next message intended for the owner of this environment and
/// writes it into the target buffer, up to a max of buf_len.
///
/// If no message exists, or the caller failed to make a previous call to
/// next_msg_size, the buffer will not be filled and an error
/// message will be added to the queue.
///
/// If the buffer is not large enough, the buffer will be partially filled,
/// but an error message will be added to the queue.
///
/// This message can be assumed to be the wire format of
/// the SCAII protobuf type MultiMessage.
#[no_mangle]
pub extern "C" fn next_msg(env: *mut Environment, buf: *mut c_uchar, buf_len: size_t) {
    use std::slice;
    use std::io::Cursor;
    use scaii_defs::protos::endpoint::Endpoint;
    use scaii_defs::protos::{CoreEndpoint, AgentEndpoint};

    unsafe {
        match (*env).next_msg {
            None => {
                (*env)
                    .router
                    .send_error(
                        "Call to next_msg when no message\
                 is queued or without preceding call to next_msg_size",
                        &Endpoint::Agent(AgentEndpoint {}),
                        &Endpoint::Core(CoreEndpoint {}),
                    )
                    .expect(FATAL_OWNER_ERROR);

                return;
            }
            Some(ref msg) => {
                let mut buf = slice::from_raw_parts_mut(buf, buf_len);
                let result = msg.encode(&mut Cursor::new(&mut buf));
                match result {
                    Err(err) => {
                        (*env)
                            .router
                            .send_error(
                                &format!("Error writing to buffer: {}", err),
                                &Endpoint::Agent(AgentEndpoint {}),
                                &Endpoint::Core(CoreEndpoint {}),
                            )
                            .expect(FATAL_OWNER_ERROR);
                    }
                    Ok(_) => {}
                }
            }
        }

        (*env).next_msg = None;
    }
}

/// Queries the size of the next message intended for the owner of this environment.
///
/// If no message exists, 0 will be returned.
///
/// A call to this will query any existing modules (backends etc)
/// for any messages they would like to send. This is done
/// BEFORE computing the size.
#[no_mangle]
pub extern "C" fn next_msg_size(env: *mut Environment) -> size_t {
    unsafe {
        // TODO process messages from module
        let core_msgs = (*env).router.process_module_messages();
        (*env).process_core_messages(core_msgs);
        let next_msg = (*env).router.agent_mut().unwrap().get_messages();
        let out = next_msg.encoded_len();

        (*env).next_msg = Some(next_msg);

        out
    }
}

/// Routes a collection of messages to arbitrary receivers and checks for
/// responses.
///
/// The message must conform to the MultiMessage SCAII protobuf wire format. If
/// the message cannot be parsed, an error will be added to the message
/// queue.
///
/// The return value is equivalent to a query to `next_msg_size`.
#[no_mangle]
pub extern "C" fn route_msg(env: *mut Environment, msg_buf: *mut c_uchar, msg_len: size_t) -> size_t {
    use std::slice;
    use scaii_defs::protos::endpoint::Endpoint;
    use scaii_defs::protos::{CoreEndpoint, AgentEndpoint};

    unsafe {
        let core_packets = match MultiMessage::decode(slice::from_raw_parts(msg_buf, msg_len)) {
            Err(err) => {
                (*env)
                    .router
                    .send_error(
                        &format!("Could not parse message. Is it a MultiMessage? {}", err),
                        &Endpoint::Agent(AgentEndpoint {}),
                        &Endpoint::Core(CoreEndpoint {}),
                    )
                    .expect(FATAL_OWNER_ERROR);
                Vec::new()
            }
            Ok(msg) => (*env).router.decode_and_route(&msg),
        };

        (*env).process_core_messages(core_packets);

        next_msg_size(env)
    }
}
