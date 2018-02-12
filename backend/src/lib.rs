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

pub mod engine;
pub(crate) mod util;
pub mod protos;
pub mod error;

use engine::Rts;

use scaii_defs::{Backend, BackendSupported, Module, SerializationStyle};
use scaii_defs::protos::{BackendCfg, Endpoint, MultiMessage, ScaiiPacket, SerializationRequest};
use scaii_defs::protos::SerializationResponse as SerResp;

use std::error::Error;

const SUPPORTED: BackendSupported = BackendSupported {
    serialization: SerializationStyle::None,
};

pub struct Context<'a, 'b> {
    rts: Rts<'a, 'b>,
    awaiting_msgs: Vec<MultiMessage>,
}

impl<'a, 'b> Context<'a, 'b> {
    fn diverge(&mut self) {
        self.rts.diverge();
    }

    fn configure(&mut self, cfg: &BackendCfg) -> Result<(), Box<Error>> {
        use protos::{Config, Scenario};
        use prost::Message;

        if let Some(ref bytes) = cfg.cfg_msg {
            let cfg = Config::decode(&*bytes)?;

            self.rts.render = cfg.emit_viz.unwrap_or_default();

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
        use util;

        let src = &packet.src;

        match packet.specific_msg {
            Some(SpecificMsg::Config(Cfg {
                which_module: Some(WhichModule::BackendCfg(ref backend_cfg)),
            })) => {
                let out = self.configure(backend_cfg);
                self.awaiting_msgs.push(util::ack_msg());
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

                self.rts.action_input(Default::default());

                while self.rts.skip() {
                    mm = self.rts.update();
                }

                self.awaiting_msgs.push(mm);
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
