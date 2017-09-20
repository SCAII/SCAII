extern crate libloading;
extern crate protobuf;
extern crate libc;
extern crate toml;
extern crate scaii_defs;
#[macro_use]
extern crate lazy_static;

use libc::{c_char, size_t};


// Don't publicly expose our internal structure to FFI
pub(crate) mod internal;

use internal::router::Router;

pub struct Environment {
    router: internal::router::Router,
}

/// Given a configuration string, we can configure a new environment on which
/// all other functions will be run. The resulting environment is allocated on the heap.
#[no_mangle]
pub fn new_environment(cfg_str: *const c_char, cfg_len: size_t) -> *mut Environment {
    use std::mem::ManuallyDrop;

    let env = ManuallyDrop::new(Box::new(Environment { router: Router::new() }));
    Box::into_raw(ManuallyDrop::into_inner(env));

    unimplemented!("Router setup")
}

/// Destroys the created environment, this should be called to avoid memory leaks.
#[no_mangle]
pub fn destroy_environment(env: *mut Environment) {
    use std::mem::ManuallyDrop;

    unsafe {
        let mut env = ManuallyDrop::new(Box::from_raw(env));
        ManuallyDrop::drop(&mut env);
    }
    unimplemented!()
}

/// Changes the configuration of an existing environment using a configuration string.
#[no_mangle]
pub fn cfg_environment(env: *mut Environment, cfg_str: *const c_char, cfg_len: size_t) {
    unimplemented!()
}

/// The `act` function routes an action message to the underlying environment and
/// returns the size of the next message in the message queue (which will usually
/// be the next state, or an error).
///
/// If the queue is not empty when this is called, the correct size of the first awaiting message
/// will be returned **but** an error message will be appended to
/// the queue **before** the response message.
///
/// The raw message should **not** be wrapped
/// in a `ScaiiPacket`, as the target is presumed to be the backend.
///
/// This is a convenience function for `route_msg` with a `ScaiiWrapper` routed to
/// "backend" followed by `next_msg_size`.
///
/// Unlike with a call to `queued_messages`, this will **not** process async module messages,
/// except in the case where the backend is asynchronous, in which case it will **only**
/// process messages from that specific asynchronous channel.
#[no_mangle]
pub fn act(env: *mut Environment, action_msg: *mut c_char, msg_len: size_t) -> size_t {
    unimplemented!()
}

/// This is similar to `act`, but also routes a `ScaiiPacket` to some target.
///
/// If the `generic_msg_len` argument is zero, it will only perform the action.
///
/// If there is an error parsing the `generic_msg` into a `ScaiiPacket`, an error
/// message will be appended to the message queue before any other messages are
/// generated from this function.
///
/// This has three other key differences to act:
///     1. The return value is the number of queued messages, not the size of the next message.
///     2. Due to 1, a non-empty queue will not cause an error to be generated
///     3. This will cause messages from asynchronous modules (e.g. visualization) to process
///         similar to a call to `queued_messages`.
#[no_mangle]
pub fn act_and_route(
    env: *mut Environment,
    action_msg: *mut c_char,
    action_msg_len: size_t,
    generic_msg: *mut c_char,
    generic_msg_len: size_t,
) -> size_t {
    unimplemented!()
}

/// Resets the environment to a new episode and returns the size of the next message
/// in the queue.
///
/// If the queue is not empty when this is called, the correct size of the first awaiting message
/// will be returned **but** an error message will be appended to
/// the queue **before** the response message.
///
/// This is **not** deterministic, if the environment has elements of randomization
/// in its initialization, this will return a randomized state. If you wish to
/// reset to a deterministic state (i.e. for rollout) please see `serialize`.
#[no_mangle]
pub fn reset(env: *mut Environment) -> size_t {
    unimplemented!()
}

/// Returns the size in bytes of a serialization of this environment.
///
/// If non-diverging serialization is not supported, this will return 0 and
/// append an error message to the message queue.
#[no_mangle]
pub fn serialize_size(env: *mut Environment) -> size_t {
    unimplemented!()
}

/// Writes a serialization of the environment in the target buffer,
/// up to a max of buf_len.
///
/// This is defined to be a **non-diverging** serialization. That is,
/// no matter how many times you load this state, performing the same
/// action will result in the same next state.
///
/// If non-diverging serialization is not supported, this will append an error message
/// to the message queue and the buffer will not be modified.
#[no_mangle]
pub fn serialize(env: *mut Environment, buf: *mut c_char, buf_len: size_t) {
    unimplemented!()
}

/// Resets the underlying environment to the state described by the input buffer and
/// returns the size of the next message.
///
/// If the deserialization is unsuccessful, or the environment does not support
/// non-divergng seralization, an error will be added to the queue.
///
/// If the queue is not empty when this is called, the correct size of the first awaiting message
/// will be returned **but** an error message will be appended to
/// the queue **before** the response message.
#[no_mangle]
pub fn deserialize(env: *mut Environment, buf: *mut c_char, buf_len: size_t) -> size_t {
    unimplemented!()
}

/// Returns the size in bytes of a diverging serialization of this environment.
///
/// If serialization is not supported, this will return 0 and
/// append an error message to the message queue.
///
/// If the environment is deterministic, this is equivalent to a call to
/// `serialize_size`, and no error will be raised.
#[no_mangle]
pub fn serialize_diverging_size(env: *mut Environment) -> size_t {
    unimplemented!()
}

/// Writes a serialization of the environment in the target buffer,
/// up to a max of buf_len.
///
/// This is defined to be a **diverging** serialization. That is,
/// it does not reset the RNG state, if any, and thus loading this multiple times
/// and performing the same action may yield different results.
///
/// If serialization is not supported, this will append an error message
/// to the message queue and the buffer will not be modified.
///
/// If the environment is deterministic, this is equivalent to a call to
/// `serialize`, and no error will be raised.
#[no_mangle]
pub fn serialize_diverging(env: *mut Environment, buf: *mut c_char, buf_len: size_t) {
    unimplemented!()
}

/// Resets the underlying environment to the state described by the input buffer and
/// returns the size of the next message.
///
/// If the deserialization is unsuccessful, or the environment does not support
/// seralization, an error will be added to the queue.
///
/// If the queue is not empty when this is called, the correct size of the first awaiting message
/// will be returned **but** an error message will be appended to
/// the queue **before** the response message.
///
/// If the environment is deterministic, this is equivalent to a call to
/// `deserialize`, and no error will be raised.
#[no_mangle]
pub fn deserialize_diverging(env: *mut Environment, buf: *mut c_char, buf_len: size_t) -> size_t {
    unimplemented!()
}

/// Receives the next message intended for the owner of this environment and
/// writes it into the target buffer, up to a max of buf_len.
///
/// If no message exists, the buffer will not be filled and an error
/// message will be added to the queue.
///
/// If the buffer is not large enough, the buffer will be partially filled,
/// but an error message will be added to the queue.
#[no_mangle]
pub fn next_msg(env: *mut Environment, buf: *mut u8, buf_len: size_t) {
    unimplemented!()
}

/// Queries the size of the next message intended for the owner of this environment.
///
/// If no message exists, 0 will be returned and an error message will be added to the
/// queue.
#[no_mangle]
pub fn next_msg_size(env: *mut Environment) -> size_t {
    unimplemented!()
}

/// Queries the number of messages remaining for the owner of this environment.
///
/// If asynchronous modules are loaded (such as RPC visualization), a call to this function
/// will check for awaiting messages.
#[no_mangle]
pub fn queued_messages(env: *mut Environment) -> size_t {
    unimplemented!()
}

/// Routes a message to an arbitrary receiver (e.g. visualization).
///
/// The message must conform to the ScaiiPacket protobuf class. If
/// the message cannot be parsed, an error will be added to the message
/// queue.
///
/// The return value is equivalent to a query to `queued_messages`.
#[no_mangle]
pub fn route_msg(env: *mut Environment, msg_buf: *mut c_char, msg_len: size_t) -> size_t {
    unimplemented!()
}

#[cfg(test)]
mod test {
    #[test]
    fn act() {
        unimplemented!()
    }

    #[test]
    fn reset() {
        unimplemented!()
    }

    #[test]
    fn serialization() {
        unimplemented!()
    }

    #[test]
    fn message_queueing() {
        unimplemented!()
    }

    // Tests creating and changing the config of a test environment
    #[test]
    fn environment_manipulation() {
        unimplemented!()
    }
}
