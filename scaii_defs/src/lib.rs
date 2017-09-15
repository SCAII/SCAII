extern crate protobuf;
#[macro_use]
extern crate serde_derive;

use std::path::PathBuf;

/// Contains protobuf definitions
pub mod protos;

/// A pre-decoded Protobuf message.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Msg {
    pub msg: Vec<u8>,
}

/// The list of supported backend languages
#[derive(Serialize, Deserialize, Clone, Copy, Eq, PartialEq, Debug)]
pub enum Language {
    RustFFI,
}

/// The parameters for creating a backend environment
#[derive(Serialize, Deserialize, Clone, Eq, PartialEq, Debug)]
pub struct EnvironmentInitArgs {
    pub language: Language,
    pub plugin_path: PathBuf,
}

/// The serialization style supported by an environment.
/// Currently, Nondiverging is for the benefit of a frontend only (i.e.
/// optimizing MCTS for deterministic environments), NondivergingOnly,
/// and Full are treated the same way by the SCAII internals (and
/// backends, by spec).
#[derive(Serialize, Deserialize, Clone, Copy, Eq, PartialEq, Debug)]
pub enum SerializationStyle {
    None,
    DivergingOnly,
    NondivergingOnly,
    Full,
}

/// The supported behavior of a given backend environment,
/// currently the only relevant one is serialization support.
#[derive(Serialize, Deserialize, Clone, Eq, PartialEq, Debug)]
pub struct SupportedBehavior {
    pub serialization: SerializationStyle,
}