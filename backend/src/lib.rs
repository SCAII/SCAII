// Copyright 2017-2018 The SCAII Developers.
//
// Licensed under the 3-Clause BSD license
// <BSD-3-Clause or https://opensource.org/licenses/BSD-3-Clause>
// This file may not be copied, modified, or distributed
// except according to those terms.
//! A Real-Time Strategy game for AI and machine learning research.
//!
//! Sky-RTS is a small RTS environment for the SCAII learning environment.
//! It is compiled as a dynamically linked binary and loaded as a plugin by
//! the core environment (though it can also be linked statically from Rust).
//!
//! The most common way to use this environment is to load the `new_backend`
//! function and use `Module::process_msg` and `Module::get_messages` to handle
//! the messages defined in the SCAII documentation.
//!
//! The RTS also exposes some RTS-specific protobuf definitions in the `protos` module
//! which are used to ease communication between RTS and user. Of particular note is
//! the `ActionList` type which is used to move units to arbitrary locations.
//!
//! Upon reset or update, this will return a `State` and/or visualization (`Viz`)
//! packet which communicates the data for consumption by the proper
//! parts of the system. In particular, `State` should be parsed by the agent,
//! while `Viz` by the visualization system.
//!
//! `State` consists of a 40x40x4 array encoding the unit IDs at each cell, the
//! unit's HP, the unit type, and the faction the unit belongs to. Changing the encoding
//! (e.g. One-HOTing it) should be done by the consumer.
//!
//! Scenarios
//! =========
//!
//! The RTS is used by loading short LUA configuration scripts known as "scenarios"
//! (or "maps"). These may not rely on any global state being preserved between function
//! calls, the only information used must be the inputs to the functions.
//!
//! A short example can be seen in `lua/tower_example.lua`. When configuring the RTS,
//! the scenario should
//!
//! Installation
//! ============
//!
//! After compiling, the RTS should be a shared object relevant to your platform
//! (`backend.dll` on Windows, `libbackend.dylib` on OS X, and `libbackend.so` on Linux)
//!  located in `target/release` or `target/debug` (depending on build configuration).
//! This must be unpacked into `$HOME/.scaii/backends/bin/`, additionally the name should be changed
//! to `[lib]sky-rts.[dll/so/dylib]` (not, currently on OS X you should not prefix with 'lib).
//!
//! To use the Python language glue, go to the top level of the repository and copy
//! `game_wrapper/python/*` into `$HOME/.scaii/glue/python/scaii/env/sky-rts/`. Make
//! certain you've also installed the [SCAII](https://github.com/SCAII/SCAII) glue first.
//!
//! No environment variables need be modified for this installation.
//!
//! Scenarios
//! =========
//!
//! The RTS looks for scenarios in `$HOME/.scaii/backends/sky-rts/maps/<map-name>.lua`,
//! so after writing scenarios copy them there. You may also, if you choose, copy the
//! `lua/tower_scenario.lua` file there for an example environment (which you can
//! use via Python by instantiating the `TowerExample` class).

extern crate bincode;
extern crate bytes;
#[macro_use]
extern crate lazy_static;
extern crate nalgebra;
extern crate ncollide;
extern crate ndarray;
extern crate prost;
#[macro_use]
extern crate prost_derive;
extern crate rand;
extern crate rayon;
extern crate rlua;
extern crate scaii_defs;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate shred;
#[macro_use]
extern crate shred_derive;
extern crate specs;
#[macro_use]
extern crate specs_derive;

mod engine;
pub(crate) mod util;
pub mod protos;

use engine::Rts;

use scaii_defs::{Backend, BackendSupported, Module, SerializationStyle};
use scaii_defs::protos::{BackendCfg, Endpoint, MultiMessage, ScaiiPacket, SerializationRequest};
use scaii_defs::protos::SerializationResponse as SerResp;

use std::error::Error;

/// The supported serialization for the RTS
const SUPPORTED: BackendSupported = BackendSupported {
    serialization: SerializationStyle::Full,
};

/// A context into the RTS environment. Multiple may be created
/// and used for, e.g., batching.
///
/// This is typically used as a `Backend` trait object.
pub struct Context<'a, 'b> {
    rts: Rts<'a, 'b>,
    awaiting_msgs: Vec<MultiMessage>,
}

impl<'a, 'b> Context<'a, 'b> {
    /// Causes the RNG state to diverge after serialization,
    /// so that reloading will not yield the same outputs.
    fn diverge(&mut self) {
        self.rts.diverge();
    }

    /// Configures the RTS from a configuration packet, mostly just loads the
    /// scenario.
    fn configure(&mut self, cfg: &BackendCfg) -> Result<(), Box<Error>> {
        use protos::{Config, Scenario};
        use prost::Message;

        if let Some(ref bytes) = cfg.cfg_msg {
            let cfg = Config::decode(&*bytes)?;

            match cfg.scenario {
                Some(Scenario { ref path }) => {
                    self.rts.set_lua_path(path);

                    Ok(())
                }
                _ => Err(From::from("Unsupported config!")),
            }
        } else {
            Ok(())
        }
    }

    /// Serializes the RTS and diverges if necessary.
    fn handle_ser(&mut self, req: &SerializationRequest, src: &Endpoint) -> Result<(), Box<Error>> {
        use scaii_defs::protos::SerializationFormat as Format;
        use scaii_defs::protos::scaii_packet::SpecificMsg;
        use scaii_defs::protos::endpoint::Endpoint as End;
        use scaii_defs::protos::BackendEndpoint;

        let serialized = match req.format() {
            Format::Diverging => self.serialize_diverging(None)?,
            Format::Nondiverging => self.serialize(None)?,
        };

        let resp = SerResp {
            serialized,
            format: req.format() as i32,
        };

        let packet = ScaiiPacket {
            dest: src.clone(),
            src: Endpoint {
                endpoint: Some(End::Backend(BackendEndpoint {})),
            },
            specific_msg: Some(SpecificMsg::SerResp(resp)),
        };

        self.awaiting_msgs.push(MultiMessage {
            packets: vec![packet],
        });

        Ok(())
    }
}

impl<'a, 'b> Module for Context<'a, 'b> {
    fn process_msg(&mut self, packet: &ScaiiPacket) -> Result<(), Box<Error>> {
        use scaii_defs::protos::scaii_packet::SpecificMsg;
        use scaii_defs::protos::Cfg;
        use scaii_defs::protos::cfg::WhichModule;

        let src = &packet.src;

        match packet.specific_msg {
            Some(SpecificMsg::Config(Cfg {
                which_module: Some(WhichModule::BackendCfg(ref backend_cfg)),
            })) => {
                let out = self.configure(backend_cfg);
                let mm = self.rts.init();
                self.awaiting_msgs.push(mm);
                out
            }
            Some(SpecificMsg::ResetEnv(true)) => {
                let mm = self.rts.reset();
                self.awaiting_msgs.push(mm);
                Ok(())
            }
            Some(SpecificMsg::Action(ref action)) => {
                self.rts.action_input(action.clone());
                let mut mm = self.rts.update();

                while self.rts.skip() {
                    mm = self.rts.update();
                }

                self.awaiting_msgs.push(mm);
                Ok(())
            }
            Some(SpecificMsg::EmitViz(ref render)) => {
                self.rts.set_render(*render);
                Ok(())
            }
            Some(SpecificMsg::SerReq(ref req)) => self.handle_ser(req, src),
            _ => Err(From::from(format!(
                "Invalid payload received in backend: {:?}",
                packet
            ))),
        }
    }

    fn get_messages(&mut self) -> MultiMessage {
        scaii_defs::protos::merge_multi_messages(self.awaiting_msgs.drain(..).collect())
            .unwrap_or(Default::default())
    }
}

impl<'a, 'b> Backend for Context<'a, 'b> {
    fn supported_behavior(&self) -> BackendSupported {
        SUPPORTED
    }

    fn serialize(&mut self, _into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        Ok(self.rts.serialize())
    }

    fn deserialize(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        self.rts.deserialize(buf.to_vec());

        Ok(())
    }

    fn serialize_diverging(&mut self, into: Option<Vec<u8>>) -> Result<Vec<u8>, Box<Error>> {
        let out = self.serialize(into);
        self.diverge();
        out
    }

    fn deserialize_diverging(&mut self, buf: &[u8]) -> Result<(), Box<Error>> {
        let out = self.deserialize(buf);
        self.diverge();
        out
    }
}

#[no_mangle]
pub fn new() -> Box<Module> {
    Box::new(Context {
        rts: Rts::new(),
        awaiting_msgs: vec![],
    })
}

#[no_mangle]
pub fn supported_behavior() -> BackendSupported {
    SUPPORTED
}

#[no_mangle]
pub fn new_backend() -> Box<Backend> {
    Box::new(Context {
        rts: Rts::new(),
        awaiting_msgs: vec![],
    })
}
