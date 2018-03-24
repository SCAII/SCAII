// Copyright 2017-2018 The SCAII Developers.
//
// Licensed under the 3-Clause BSD license
// <BSD-3-Clause or https://opensource.org/licenses/BSD-3-Clause>
// This file may not be copied, modified, or distributed
// except according to those terms.
//! Contains all protobuf definitions used in the RTS.
//!
//! The core suite knows nothing about these protobufs, they're encoded as raw
//! byte buffers and passed inside other message for end-to-end communication
//! between RTS-specific code on both ends.

include!(concat!(env!("OUT_DIR"), "/scaii.rts.rs"));
