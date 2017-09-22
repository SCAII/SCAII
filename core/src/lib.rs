extern crate libloading;
extern crate protobuf;
extern crate libc;
extern crate scaii_defs;
#[macro_use]
extern crate lazy_static;

use scaii_defs::protos::{RouterEndpoint, MultiMessage, ScaiiPacket, Cfg, AgentEndpoint, Endpoint};
use scaii_defs::{EnvironmentInitArgs, InitAs, PluginType};

use libc::{c_uchar, size_t};


// Don't publicly expose our internal structure to FFI
pub(crate) mod internal;

use internal::router::Router;
use internal::backend::RustDynamicBackend;
use internal::module::RustDynamicModule;

/// The Environment created by this library.
pub struct Environment {
    router: internal::router::Router,
    next_msg: Option<MultiMessage>,
}

const FATAL_OWNER_ERROR: &'static str = "FATAL CORE ERROR: Cannot forward message to owner";

impl Environment {
    /// Processes all messages returned by module message processing routed to
    /// "core"
    fn process_core_messages(&mut self, packets: &mut [ScaiiPacket]) {
        for packet in packets {
            // Forward mesages sent to Core to the owner so they can choose
            // what to do.
            if packet.has_err() {
                self.forward_err_to_owner(packet);
            }

            if packet.has_config() {
                let mut cfg = packet.take_config();
                if self.handle_cfg_errors(packet, &cfg) {
                    continue;
                }

                let cfg = cfg.take_core_cfg();

                let args = EnvironmentInitArgs::from_core_cfg(&cfg);
                match args.module_type {
                    PluginType::RustFFI { args, init_as } => {
                        match init_as {
                            // This is mostly the same code, not sure how to abstract it
                            InitAs::Backend => {
                                let backend = RustDynamicBackend::new(args.clone());
                                if let Err(err) = backend {
                                    self.handle_errors_possible_failure(
                                        packet,
                                        &format!("Backend could not be initialized: {}", err),
                                    );
                                    continue;
                                }
                                let boxed = Box::new(backend.unwrap());

                                let prev = self.router.register_backend(boxed);
                                if prev.is_some() {
                                    self.handle_errors_possible_failure(
                                        packet,
                                        "Previous backend already registered",
                                    );
                                }
                            }
                            InitAs::Module { name } => {
                                let module = RustDynamicModule::new(args.clone());
                                if let Err(err) = module {
                                    self.handle_errors_possible_failure(
                                        packet,
                                        &format!(
                                            "Module {} could not be initialized: {}",
                                            &name,
                                            err
                                        ),
                                    );
                                    continue;
                                }
                                let boxed = Box::new(module.unwrap());

                                let prev = self.router.register_module(name.clone(), boxed);
                                if prev.is_some() {
                                    self.handle_errors_possible_failure(
                                        packet,
                                        &format!("Previous module {} already registered", name),
                                    );
                                }
                            }
                        }
                    }
                }
            }

        }
        unimplemented!()
    }

    /// Handles error forwarding. First it tries the module the packet originated from,
    /// and if it can't get a hold of that it tries the owner.
    /// Otherwise, it panics because something very bad has happened.
    fn handle_errors_possible_failure(&mut self, packet: &ScaiiPacket, descrip: &str) {
        let error_src = RouterEndpoint::from_endpoint(packet.get_src());
        let res = self.router.send_error(
            descrip,
            &error_src,
            &RouterEndpoint::Core,
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
                    &RouterEndpoint::Core,
                )
                .expect(FATAL_OWNER_ERROR);
            return;
        }
    }

    /// Handles configuration errors. Just here to make the code cleaner.
    fn handle_cfg_errors(&mut self, packet: &ScaiiPacket, cfg: &Cfg) -> bool {
        if !cfg.has_core_cfg() {
            self.handle_errors_possible_failure(
                packet,
                "Core only accepts Cfg packets of type CoreCfg",
            );

            true
        } else {
            false
        }
    }

    /// Forwards an error to the owner of this environment,
    /// panicking on failure because something has gone very wrong.
    fn forward_err_to_owner(&mut self, packet: &mut ScaiiPacket) {
        let mut dest = Endpoint::new();
        dest.set_agent(AgentEndpoint::new());
        packet.set_dest(dest);
        self.router.route_to(&packet).expect(FATAL_OWNER_ERROR);
    }
}

/// Creates a clean environment, further configuration is done via sending
/// `CoreCfg` messages.
#[no_mangle]
pub fn new_environment() -> *mut Environment {
    let agent = internal::agent::PublisherAgent::new();
    let env = Box::new(Environment {
        router: Router::from_agent(Box::new(agent)),
        next_msg: None,
    });

    Box::into_raw(env)
}

/// Destroys the created environment, this should be called to avoid memory leaks.
#[no_mangle]
pub fn destroy_environment(env: *mut Environment) {
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
pub fn next_msg(env: *mut Environment, buf: *mut c_uchar, buf_len: size_t) {
    use protobuf::{Message, CodedOutputStream};
    use std::slice;

    unsafe {
        match (*env).next_msg {
            None => {
                (*env)
                    .router
                    .send_error(
                        "Call to next_msg when no message\
                 is queued or without preceding call to next_msg_size",
                        &RouterEndpoint::Agent,
                        &RouterEndpoint::Core,
                    )
                    .expect(FATAL_OWNER_ERROR);

                return;
            }
            Some(ref msg) => {
                let buf = slice::from_raw_parts_mut(buf, buf_len);
                let mut out = CodedOutputStream::bytes(buf);
                let result = msg.write_to(&mut out);
                match result {
                    Err(err) => {
                        (*env)
                            .router
                            .send_error(
                                &format!("Error writing to buffer: {}", err),
                                &RouterEndpoint::Agent,
                                &RouterEndpoint::Core,
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
pub fn next_msg_size(env: *mut Environment) -> size_t {
    use protobuf::Message;
    unsafe {
        // TODO process messages from module
        let mut core_msgs = (*env).router.process_module_messages();
        (*env).process_core_messages(&mut core_msgs);
        let next_msg = (*env).router.agent_mut().unwrap().get_messages();
        let out = next_msg.compute_size() as size_t;

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
pub fn route_msg(env: *mut Environment, msg_buf: *mut c_uchar, msg_len: size_t) -> size_t {
    use std::slice;
    use protobuf;

    unsafe {
        let mut core_packets =
            match protobuf::parse_from_bytes(slice::from_raw_parts(msg_buf, msg_len)) {
                Err(err) => {
                    (*env)
                        .router
                        .send_error(
                            &format!("Could not parse message. Is it a MultiMessage? {}", err),
                            &RouterEndpoint::Agent,
                            &RouterEndpoint::Core,
                        )
                        .expect(FATAL_OWNER_ERROR);
                    Vec::new()
                }
                Ok(msg) => (*env).router.decode_and_route(&msg),
            };

        (*env).process_core_messages(&mut core_packets);

        next_msg_size(env)
    }
}
