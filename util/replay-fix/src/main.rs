#[macro_use]
extern crate failure;
extern crate glob;
extern crate scaii_core;
extern crate scaii_defs;
#[macro_use]
extern crate log;
extern crate bincode;
extern crate cd_manager;
extern crate clap;
extern crate env_logger;
extern crate prost;
extern crate sky_rts;
extern crate websocket;

use clap::ArgMatches;
use std::path::Path;
use std::path::PathBuf;
use std::sync::mpsc::{Receiver, Sender};

use scaii_core::{ActionWrapper, SerializationInfo};
use scaii_defs::protos::{MultiMessage, ScaiiPacket};
use sky_rts::Context;

use failure::Error;

fn main() {
    use clap::{App, Arg};

    let matches = App::new(env!("CARGO_PKG_NAME"))
        .version(env!("CARGO_PKG_VERSION"))
        .about("Fixes keyframes in a .scr SCAII Replay")
        .author("Zoe Juozapaitis <Jragonmiris@gmail.com>")
        .arg(
            Arg::with_name("files")
                .short("f")
                .long("files")
                .value_name("GLOB")
                .help("A glob of replay input files (such as ./*.scr)")
                .takes_value(true)
                .required(true),
        )
        .arg(
            Arg::with_name("out")
                .short("o")
                .long("out")
                .value_name("FOLDER")
                .help("A folder where replay files will be output, will be created if nonexistent")
                .takes_value(true)
                .required(true),
        )
        .get_matches();

    env_logger::init();
    if let Err(err) = run(matches) {
        for cause in err.iter_chain() {
            eprintln!("{}", cause);
        }
        std::process::exit(1);
    }
}

fn run(matches: ArgMatches) -> Result<(), Error> {
    use failure::ResultExt;
    use std::fs;
    use std::sync::mpsc;
    use std::thread;

    let input = matches.value_of("files").unwrap();
    let out_dir = matches.value_of("out").unwrap();

    let (mut tx_frame, rx_frame) = mpsc::channel();
    let (tx_resp, mut rx_resp) = mpsc::channel();

    let join = thread::spawn(move || rewrite(rx_frame, tx_resp));

    fs::create_dir_all(out_dir).context(format_err!(
        "Can't create needed supplied directory: {}",
        out_dir
    ))?;

    let mut out_dir = PathBuf::from(out_dir);
    fs::create_dir_all(&out_dir)?;

    for infile in glob::glob(input).context(format_err!("Invalid glob {}", input))? {
        match infile.context("Failed attempt to parse glob path") {
            Ok(ref infile) => {
                if let Err(e) = convert(infile, &mut out_dir, &mut tx_frame, &mut rx_resp) {
                    error!(
                        "{}",
                        format_err!("Could not convert file {} because:", infile.display())
                    );
                    for cause in e.iter_chain() {
                        eprintln!("{}", cause);
                    }
                }
            }

            Err(e) => warn!(
                "{}",
                Err::<(), _>(e)
                    .context(format_err!("Unparseable path in glob {}", input))
                    .unwrap_err()
            ),
        }
    }

    drop(tx_frame);
    join.join().expect("Could not join communication thread");

    Ok(())
}

fn convert<P: AsRef<Path>>(
    in_path: P,
    out_dir: &mut PathBuf,
    msg: &mut Sender<ScaiiPacket>,
    resp: &mut Receiver<Result<ScaiiPacket, Error>>,
) -> Result<(), Error> {
    let in_path = in_path.as_ref();
    use cd_manager::CdManager;
    use failure::ResultExt;
    use prost::Message;
    use scaii_core::ReplayAction;
    use scaii_defs::Module;
    use sky_rts::Context;

    if !in_path.exists() {
        return Err(format_err!("Input file does not exist"));
    } else if !in_path.is_file() {
        info!("Ignoring directory {}", in_path.display());
        return Ok(()); // silently ignore directories
    }

    let mut out_dir = CdManager::new(out_dir);
    out_dir.push(in_path.file_name().unwrap());

    let out_path = out_dir.as_ref();

    if out_path.exists() {
        return Err(format_err!("Output file already exists"));
    }

    info!(
        "Attempting to convert file {} into {}",
        in_path.display(),
        out_path.display()
    );

    let mut replay = scaii_core::load_replay_file(in_path)
        .map_err(|e| format_err!("{}", e))
        .context(format_err!(
            "Could not parse {} as replay",
            in_path.display()
        ))?;

    ensure!(
        replay.len() > 0,
        "There are no steps in the file {}, it's probably not a replay",
        in_path.display()
    );

    let mut rts = Context::new();
    rts.force_send_state();
    rts.set_replay_mode(true);
    let mut msgs = {
        let mut iter = replay.iter_mut();
        if let Some(ReplayAction::Header(header)) = iter.next() {
            let mut packet = ScaiiPacket::decode(&header.configs.data)
                .context("Could not decode SCAII Packet, aborting")?;

            let packet = extract_header_cfg(packet);
            rts.process_msg(&packet).unwrap();
            rts.get_messages();
        } else {
            bail!("Header should always be the first in a replay");
        }

        if let Some(ReplayAction::Keyframe(ref ser, ref mut action)) = iter.next() {
            let _msgs = handle_keyframe(ser, &mut rts)?;
            // We need to force an update because the first deserialize
            // requires an update to correctly spawn units (i.e. frame 0 is "empty")
            rts.force_update();
            let msgs = rts.get_messages();
            if action.has_explanation {
                process_overwrite(msgs, action, msg, resp)?;
            }
            next_state(&mut rts, action)?
        } else {
            bail!("Keyframe should always come after header");
        }
    };

    for elem in replay.iter_mut().skip(2) {
        match elem {
            ReplayAction::Keyframe(ref ser, ref mut action) => {
                msgs = handle_keyframe(ser, &mut rts)?;
                if action.has_explanation {
                    process_overwrite(msgs, action, msg, resp)?;
                }
                msgs = next_state(&mut rts, action)?;
            }
            ReplayAction::Delta(ref mut action) => {
                if action.has_explanation {
                    process_overwrite(msgs, action, msg, resp)?;
                }
                msgs = next_state(&mut rts, action)?;
            }
            _ => panic!("The header shouldn't ever be here"),
        }
    }

    scaii_core::save_replay_file(out_path, &replay)
        .map_err(|e| format_err!("{}", e))
        .context(format_err!(
            "Could not encode new replay file {}",
            out_path.display()
        ))?;

    Ok(())
}

fn extract_header_cfg(packet: ScaiiPacket) -> ScaiiPacket {
    use scaii_defs::protos::{cfg::WhichModule, scaii_packet::SpecificMsg, Cfg, RecorderConfig};
    if let ScaiiPacket {
        specific_msg: Some(SpecificMsg::RecorderConfig(RecorderConfig { pkts: packets, .. })),
        ..
    } = packet
    {
        for pkt in packets {
            if let pkt @ ScaiiPacket {
                specific_msg:
                    Some(SpecificMsg::Config(Cfg {
                        which_module: Some(WhichModule::BackendCfg(_)),
                    })),
                ..
            } = pkt
            {
                return pkt;
            }
        }
    } else {
        panic!("Wrong messages in header");
    };

    panic!("No config in header?")
}

fn next_state(rts: &mut Context, action: &ActionWrapper) -> Result<MultiMessage, Error> {
    use failure::ResultExt;
    use prost::Message;
    use scaii_defs::protos::{scaii_packet::SpecificMsg, Action, AGENT_ENDPOINT, BACKEND_ENDPOINT};
    use scaii_defs::Module;

    let orig_action =
        Action::decode(&action.serialized_action).context("Could not decode action, aborting")?;

    let packet = ScaiiPacket {
        src: AGENT_ENDPOINT,
        dest: BACKEND_ENDPOINT,
        specific_msg: Some(SpecificMsg::Action(orig_action)),
    };

    rts.process_msg(&packet).unwrap();
    Ok(rts.get_messages())
}

fn process_overwrite(
    msgs: MultiMessage,
    action: &mut ActionWrapper,
    msg: &mut Sender<ScaiiPacket>,
    resp: &mut Receiver<Result<ScaiiPacket, Error>>,
) -> Result<(), Error> {
    info!("Overwriting state");

    use scaii_defs::protos::scaii_packet::SpecificMsg;
    for packet in msgs.packets.into_iter() {
        if let packet @ ScaiiPacket {
            specific_msg: Some(SpecificMsg::State(_)),
            ..
        } = packet
        {
            msg.send(packet)?;
            let action_resp = resp.recv()??;
            reencode_action(action, action_resp)?;
        }
    }

    Ok(())
}

fn handle_keyframe(ser: &SerializationInfo, rts: &mut Context) -> Result<MultiMessage, Error> {
    use failure::ResultExt;
    use prost::Message;
    use scaii_defs::{
        protos::{
            scaii_packet::SpecificMsg, SerializationResponse, AGENT_ENDPOINT, BACKEND_ENDPOINT,
        },
        Module,
    };

    info!("Processing keyframe");

    let ser_resp = SerializationResponse::decode(&ser.data.data)
        .context("Could not decode SerializationResponse, aborting")?;

    let ser_resp = ScaiiPacket {
        src: AGENT_ENDPOINT,
        dest: BACKEND_ENDPOINT,
        specific_msg: Some(SpecificMsg::SerResp(ser_resp)),
    };

    rts.process_msg(&ser_resp).unwrap();
    Ok(rts.get_messages())
}

fn reencode_action(wrapper: &mut ActionWrapper, packet: ScaiiPacket) -> Result<(), Error> {
    use failure::ResultExt;
    use prost::Message;
    use scaii_defs::protos::{scaii_packet::SpecificMsg, Action, ScaiiPacket};

    let orig_action =
        Action::decode(&wrapper.serialized_action).context("Could not decode action, aborting")?;

    if let ScaiiPacket {
        specific_msg: Some(SpecificMsg::Action(action)),
        ..
    } = packet
    {
        if action.discrete_actions != orig_action.discrete_actions
            || action.alternate_actions != orig_action.alternate_actions
        {
            warn!("Actions have changed, this is bad!");
        }

        if action.explanation.is_none() {
            warn!("Explanation does not exist");
            wrapper.has_explanation = false;
        }

        wrapper.serialized_action.clear();

        action
            .encode(&mut wrapper.serialized_action)
            .context("Could not encode new Action")?;
    } else {
        bail!("Malformed response, expected action... aborting");
    }

    Ok(())
}

fn rewrite(msg: Receiver<ScaiiPacket>, resp: Sender<Result<ScaiiPacket, Error>>) {
    use prost::Message;
    use std::net::{IpAddr, SocketAddr};
    use std::str::FromStr;
    use std::time::Duration;
    use websocket::message::Message as SocketMessage;
    use websocket::server::sync::Server;
    use websocket::OwnedMessage;

    info!("Attempting connection on port 6112");

    let mut server = Server::bind(SocketAddr::new(
        IpAddr::from_str("127.0.0.1").unwrap(),
        6112,
    )).unwrap();

    let connection = match server.accept() {
        Ok(c) => c,
        Err(_) => panic!("Can't connect"),
    };

    connection
        .tcp_stream()
        .set_read_timeout(Some(Duration::new(50000, 0)))
        .unwrap();

    connection
        .tcp_stream()
        .set_write_timeout(Some(Duration::new(50000, 0)))
        .unwrap();

    let mut connection = connection.accept().unwrap();

    info!("Connection received");

    let mut buf: Vec<u8> = Vec::new();

    for packet in msg.into_iter() {
        info!("Received packet to convert");
        buf.clear();
        let err = packet.encode(&mut buf);
        if let Err(e) = err {
            resp.send(Err(From::from(
                Error::from(e).context(format_err!("Could not encode packet for sending")),
            ))).unwrap();
            continue;
        }
        let err = connection.send_message(&SocketMessage::binary(&buf[..]));

        if let Err(e) = err {
            resp.send(Err(From::from(
                Error::from(e).context(format_err!("Could not send packet")),
            ))).unwrap();
            continue;
        }

        let msg = match connection.recv_message() {
            Ok(msg) => msg,
            Err(e) => {
                resp.send(Err(From::from(
                    Error::from(e).context(format_err!("Could not receive response packet")),
                ))).unwrap();
                continue;
            }
        };

        info!("Received response packet");

        if let OwnedMessage::Binary(vec) = msg {
            let packet = ScaiiPacket::decode(&vec).map_err(|e| format_err!("{}", e));
            resp.send(packet).unwrap();
        } else {
            panic!("Can't handle anything else")
        }
        info!("Sent converted packet back to main thread");
    }
}
