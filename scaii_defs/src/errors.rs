use std::fmt::{Display, Formatter};
use std::fmt;
use std::error::Error;

/// An error that indicates one attempted to initialize
/// a module endpoint in a ScaiiPacket with no name.
#[derive(Clone, Eq, PartialEq, Copy, Hash, Debug)]
pub struct ModuleNoNameError {}

impl Display for ModuleNoNameError {
    fn fmt(&self, fmt: &mut Formatter) -> Result<(), fmt::Error> {
        write!(fmt, "{}", self.description())
    }
}

impl Error for ModuleNoNameError {
    fn description(&self) -> &str {
        "Can't create an endpoint of type \"module\" with no name"
    }
}
