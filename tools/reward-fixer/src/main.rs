extern crate prost;
extern crate scaii_defs;
extern crate sky_rts;
extern crate walkdir;

use std::vec::IntoIter;
use std::path::{Path, PathBuf};

use sky_rts::Context;
use scaii_defs::replay::{ActionWrapper, ReplayAction, SerializationInfo};
use scaii_defs::protos::MultiMessage;

fn main() {
    use std::env;
    use std::path::PathBuf;
    use walkdir::WalkDir;

    let path = if let Some(path) = env::args().skip(1).next() {
        PathBuf::from(path)
    } else {
        panic!("Must have a file or folder of replays as a path argument");
    };

    if path.is_file() {
        let mut target = path.clone();
        target.pop();
        target.push("converted");

        convert_single_replay(path, &mut target);
    } else {
        let walker = WalkDir::new(path.clone()).into_iter();
        let mut target = path;
        target.push("converted");

        for file in walker.filter(|f| f.as_ref().map(|f| f.path().is_file()).unwrap_or(false)) {
            convert_single_replay(
                file.expect("File is missing?").path().to_path_buf(),
                &mut target,
            );
        }
    }
}

fn convert_single_replay<P: AsRef<Path>>(path: P, target: &mut PathBuf) {
    use std::fs;
    use scaii_defs::replay;
    use sky_rts::engine::resources::Terminal;

    println!("Converting replay {}", path.as_ref().display());

    let replay = match replay::load_replay_file(&path) {
        Ok(replay) => replay,
        Err(_) => {
            println!("File {} is not a replay, skipping", path.as_ref().display());
            return;
        }
    };
    let replay_length = replay.len();

    let mut out = Vec::with_capacity(replay.len());
    let mut replay = replay.into_iter();

    let mut rts = build_rts(&mut replay, &mut out);

    for (i, replay_action) in replay.enumerate() {
        println!("Converting replay step {} of {}", i + 1, replay_length - 1);
        println!("terminal? {:?}", *rts.rts.world.read_resource::<Terminal>());

        match replay_action {
            ReplayAction::Delta(action) => {
                step(&mut rts, &action);
                out.push(ReplayAction::Delta(action));
            }
            ReplayAction::Keyframe(mut keyframe, action) => {
                if i == 0 {
                    zero_rewards(&mut rts, &mut keyframe);
                }
                rekey(&mut rts, &mut keyframe);
                step(&mut rts, &action);

                out.push(ReplayAction::Keyframe(keyframe, action));
            }
            ReplayAction::Header(..) => unreachable!("Headers only exist at the start of a replay"),
        }
    }

    let fname = path.as_ref()
        .file_name()
        .expect("No file name at end?")
        .to_os_string();

    fs::create_dir_all(&target).expect("Could not crate conversion directory");

    target.push(fname);
    replay::save_replay(&target, &out).expect("Could not save replay");
    target.pop();
}

fn build_rts<'a, 'b>(
    replay: &mut IntoIter<ReplayAction>,
    out: &mut Vec<ReplayAction>,
) -> Context<'a, 'b> {
    use scaii_defs::protos::{BackendCfg, Cfg, ScaiiPacket, BACKEND_ENDPOINT, REPLAY_ENDPOINT};
    use scaii_defs::protos::scaii_packet::SpecificMsg;
    use scaii_defs::protos::cfg::WhichModule;
    use scaii_defs::Module;
    use prost::Message;

    let header = replay.next().expect("Replay has no elements");
    out.push(header.clone());

    let header = header
        .header()
        .expect("Replay has no header, correct file?");

    let packet =
        ScaiiPacket::decode(header.configs.data).expect("Could not decode header SCAII Packet");
    let mut backend_cfg = if let SpecificMsg::RecorderConfig(mut cfg) = packet.specific_msg.unwrap()
    {
        // Always exactly 2 header packets right now, one of which is the backend.
        cfg.pkts.pop().unwrap()
    } else {
        panic!("Malformed replay, expected recorder config");
    };

    if let Some(SpecificMsg::Config(Cfg {
        which_module:
            Some(WhichModule::BackendCfg(BackendCfg {
                ref mut is_replay_mode,
                ..
            })),
    })) = backend_cfg.specific_msg
    {
        *is_replay_mode = true;
    } else {
        panic!("Expected backend config");
    }

    let mut rts = Context::new();
    rts.process_msg(&backend_cfg)
        .expect("Could not process cfg msg");
    check_error(&rts.get_messages());

    let packet = ScaiiPacket {
        src: REPLAY_ENDPOINT,
        dest: BACKEND_ENDPOINT,
        specific_msg: Some(SpecificMsg::ReplayMode(true)),
    };

    rts.process_msg(&packet).expect("replay mode");
    check_error(&rts.get_messages());

    rts
}

fn check_error(mm: &MultiMessage) {
    for msg in &mm.packets {
        use scaii_defs::protos::scaii_packet::SpecificMsg;
        if let Some(SpecificMsg::Err(ref err)) = msg.specific_msg {
            panic!("Got error from RTS: {:?}", err);
        }
    }
}

fn step(rts: &mut Context, action: &ActionWrapper) {
    use scaii_defs::protos::{Action, ScaiiPacket, AGENT_ENDPOINT, BACKEND_ENDPOINT};
    use scaii_defs::protos::scaii_packet::SpecificMsg;
    use scaii_defs::Module;
    use prost::Message;

    use sky_rts::engine::resources::Terminal;

    let mut action =
        Action::decode(&action.serialized_action).expect("Unable to decode action packet");
    action.explanation = None;

    let action = ScaiiPacket {
        dest: BACKEND_ENDPOINT,
        src: AGENT_ENDPOINT,
        specific_msg: Some(SpecificMsg::Action(action)),
    };

    rts.process_msg(&action).unwrap();
    check_error(&rts.get_messages());
}

fn rekey(rts: &mut Context, keyframe: &mut SerializationInfo) {
    use scaii_defs::protos::SerializationRequest as SerReq;
    use scaii_defs::protos::SerializationFormat as SerFormat;
    use scaii_defs::protos::{ScaiiPacket, AGENT_ENDPOINT, BACKEND_ENDPOINT};
    use scaii_defs::protos::scaii_packet::SpecificMsg;
    use scaii_defs::Module;
    use prost::Message;

    let packet = ScaiiPacket {
        src: AGENT_ENDPOINT,
        dest: BACKEND_ENDPOINT,
        specific_msg: Some(SpecificMsg::SerReq(SerReq {
            format: SerFormat::Nondiverging as i32,
        })),
    };

    rts.process_msg(&packet)
        .expect("Could not process serialization request packet");
    let msgs = rts.get_messages();
    check_error(&msgs);

    let ser_resp = msgs.packets
        .into_iter()
        .filter_map(|msg| {
            if let ScaiiPacket {
                specific_msg: Some(SpecificMsg::SerResp(resp)),
                ..
            } = msg
            {
                Some(resp)
            } else {
                None
            }
        })
        .next()
        .expect("No serialization response after serialization?");

    keyframe.data.data.clear();

    ser_resp
        .encode(&mut keyframe.data.data)
        .expect("Could not encode serialization response from backend?");
}

fn zero_rewards(rts: &mut Context, keyframe: &mut SerializationInfo) {
    use scaii_defs::protos::SerializationResponse as SerResp;
    use scaii_defs::protos::{ScaiiPacket, AGENT_ENDPOINT, BACKEND_ENDPOINT};
    use scaii_defs::protos::scaii_packet::SpecificMsg;
    use scaii_defs::Module;
    use prost::Message;

    use sky_rts::engine::resources::{CumReward, Reward};

    let resp = SerResp::decode(&keyframe.data.data).expect("Could not decode ser resp");

    let packet = ScaiiPacket {
        src: AGENT_ENDPOINT,
        dest: BACKEND_ENDPOINT,
        specific_msg: Some(SpecificMsg::SerResp(resp)),
    };

    rts.process_msg(&packet)
        .expect("Could not process serialization response");

    check_error(&rts.get_messages());

    for v in rts.rts.world.write_resource::<Reward>().0.values_mut() {
        *v = 0.0;
    }

    for v in rts.rts.world.write_resource::<CumReward>().0.values_mut() {
        *v = 0.0;
    }
}
