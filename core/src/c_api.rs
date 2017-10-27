use libc::{c_uchar, size_t};
use prost::Message;
use scaii_defs::protos::MultiMessage;
use super::{Environment, FATAL_OWNER_ERROR};
use internal::router::Router;
use std::rc::Rc;
use std::cell::RefCell;
use internal::agent::PublisherAgent;

pub struct CContext {
    env: Environment,
    next_msg: Option<MultiMessage>,
    agent: Rc<RefCell<PublisherAgent>>,
}

impl CContext {
    fn new() -> Self {
        let (env, agent) = Environment::agent_owned();
        CContext {
            env: env,
            next_msg: None,
            agent: agent,
        }
    }

    fn take_next_msg(&mut self) -> Option<MultiMessage> {
        use std::mem;
        mem::replace(&mut self.next_msg, None)
    }


    fn router_mut(&mut self) -> &mut Router {
        self.env.router_mut()
    }


    fn env_mut(&mut self) -> &mut Environment {
        &mut self.env
    }

    fn cache_next_msg(&mut self) {
        use scaii_defs::protos;
        use std::mem;

        // These next few lines are needed to appease the borrow checker,
        // apparently doing the MultiMessage in one expression isn't allowed,
        // not is it allowed in TWO expressions (a borrow and a collect)
        let agent = &mut *self.agent.borrow_mut();
        let packets = agent.incoming_messages.drain(..).collect();

        let next_msg = MultiMessage { packets: packets };

        self.next_msg = match self.next_msg {
            None => Some(next_msg),
            Some(ref mut curr_msg) => {
                let curr_msg = mem::replace(
                    curr_msg,
                    MultiMessage {
                        packets: Vec::new(),
                    },
                );
                let msgs = vec![curr_msg, next_msg];
                protos::merge_multi_messages(msgs)
            }
        };
    }

    fn cached_msg_size(&self) -> usize {
        use prost::Message;

        match self.next_msg {
            None => 0,
            Some(ref msg) => msg.encoded_len(),
        }
    }
}


/// Creates a clean environment, further configuration is done via sending
/// `CoreCfg` messages.
#[no_mangle]
pub unsafe extern "C" fn new_environment() -> *mut CContext {
    let env = Box::new(CContext::new());
    Box::into_raw(env)
}

/// Destroys the created environment, this should be called to avoid memory leaks.
#[no_mangle]
pub unsafe extern "C" fn destroy_environment(env: *mut CContext) {
    Box::from_raw(env);
}

/// Receives the next message intended for the owner of this environment and
/// writes it into the target buffer, up to a max of `buf_len`.
///
/// If no message exists, or the caller failed to make a previous call to
/// `next_msg_size`, the buffer will not be filled and an error
/// message will be added to the queue.
///
/// If the buffer is not large enough, the buffer will be partially filled,
/// but an error message will be added to the queue.
///
/// This message can be assumed to be the wire format of
/// the SCAII protobuf type `MultiMessage`.
#[no_mangle]
pub unsafe extern "C" fn next_msg(env: *mut CContext, buf: *mut c_uchar, buf_len: size_t) {
    use std::slice;
    use std::io::Cursor;
    use scaii_defs::protos::endpoint::Endpoint;
    use scaii_defs::protos::{AgentEndpoint, CoreEndpoint};

    let env = &mut *env;
    let next_msg = env.take_next_msg();

    match next_msg {
        None => {
            env.router_mut()
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
            if let Err(err) = result {
                env.router_mut()
                    .send_error(
                        &format!("Error writing to buffer: {}", err),
                        &Endpoint::Agent(AgentEndpoint {}),
                        &Endpoint::Core(CoreEndpoint {}),
                    )
                    .expect(FATAL_OWNER_ERROR);
            }
        }
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
pub unsafe extern "C" fn next_msg_size(env: *mut CContext) -> size_t {
    let env = &mut *env;
    env.env_mut().update();
    env.cache_next_msg();

    env.cached_msg_size()
}

/// Routes a collection of messages to arbitrary receivers and checks for
/// responses.
///
/// The message must conform to the `MultiMessage` SCAII protobuf wire format. If
/// the message cannot be parsed, an error will be added to the message
/// queue.
///
/// The return value is equivalent to a query to `next_msg_size`.
#[no_mangle]
pub unsafe extern "C" fn route_msg(
    env: *mut CContext,
    msg_buf: *mut c_uchar,
    msg_len: size_t,
) -> size_t {
    use std::slice;
    use scaii_defs::protos::endpoint::Endpoint;
    use scaii_defs::protos::{AgentEndpoint, CoreEndpoint};

    let env = &mut *env;

    match MultiMessage::decode(slice::from_raw_parts(msg_buf, msg_len)) {
        Err(err) => {
            env.router_mut()
                .send_error(
                    &format!("Could not parse message. Is it a MultiMessage? {}", err),
                    &Endpoint::Agent(AgentEndpoint {}),
                    &Endpoint::Core(CoreEndpoint {}),
                )
                .expect(FATAL_OWNER_ERROR);
        }
        Ok(msg) => env.env_mut().route_messages(&msg),
    };

    next_msg_size(env)
}
