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
#[derive(Serialize, Deserialize, Clone, Eq, PartialEq)]
pub enum Language {
    RustFFI,
}

/// The parameters for creating a backend environment
#[derive(Serialize, Deserialize, Clone, Eq, PartialEq)]
pub struct EnvironmentInitArgs {
    pub language: Language,
    pub plugin_path: PathBuf,
}