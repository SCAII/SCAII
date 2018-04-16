use protos::Endpoint;

/// An Agent destination or source
pub const AGENT_ENDPOINT: Endpoint = Endpoint {
    endpoint: Some(super::endpoint::Endpoint::Agent(super::AgentEndpoint {})),
};

/// A Backend destination or source
pub const BACKEND_ENDPOINT: Endpoint = Endpoint {
    endpoint: Some(super::endpoint::Endpoint::Backend(
        super::BackendEndpoint {},
    )),
};

/// A Replay destination or source
pub const REPLAY_ENDPOINT: Endpoint = Endpoint {
    endpoint: Some(super::endpoint::Endpoint::Replay(super::ReplayEndpoint {})),
};

/// A Recorder destination or source
pub const RECORDER_ENDPOINT: Endpoint = Endpoint {
    endpoint: Some(super::endpoint::Endpoint::Recorder(
        super::RecorderEndpoint {},
    )),
};

/// A Core destination or source
pub const CORE_ENDPOINT: Endpoint = Endpoint {
    endpoint: Some(super::endpoint::Endpoint::Core(super::CoreEndpoint {})),
};

/// A Module destination or source
pub fn mod_endpoint<S: Into<String>>(name: S) -> Endpoint {
    Endpoint {
        endpoint: Some(super::endpoint::Endpoint::Module(super::ModuleEndpoint {
            name: name.into(),
        })),
    }
}
