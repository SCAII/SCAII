use scaii_defs::Msg;
use std::error::Error;

/// The Module trait describes any Module that may send and receive messages
pub trait Module: Sized {
    /// Creates a new instance of this module from some configuration.
    /// This need not instantiate the actual receiver, but instead may simple
    /// open a socket and wait for a connected etc.
    ///
    /// Errors if the module can not be loaded, connected to, etc.
    ///
    /// The `cfg` param refers to the configuration of the loader (e.g. plugin path)
    /// , while `module_cfg` is the configuration of the module itself.
    ///
    /// The `module_cfg` param will be passed to the module without parsing.
    fn new(cfg: &str, module_cfg: &str) -> Result<Self, Box<Error>>;

    /// Processes a message and returns an error if the message is ill-formatted
    /// or unexpected.
    ///
    /// This is called AFTER the `ScaiiPacket` is unwrapped and routed.
    /// That is, the module only gets the payload, not the routing wrapper.
    fn process_msg(&mut self, msg: &Msg) -> Result<(), Box<Error>>;

    /// Gets all waiting messages from the module, and clears the module's
    /// outgoing message queue.
    fn get_messages(&mut self) -> Vec<Msg>;
}