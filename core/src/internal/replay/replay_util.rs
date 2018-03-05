
use protos::{BackendEndpoint, BackendInit, Cfg, CoreEndpoint,
             ModuleEndpoint, MultiMessage,
             ReplayEndpoint, ReplaySessionConfig, RustFfiConfig, ScaiiPacket};
use protos::cfg::WhichModule;
use protos::endpoint::Endpoint;
use protos::scaii_packet::SpecificMsg;
use scaii_core::{ReplayAction, ScaiiConfig};
use scaii_defs::protos;
use std::error::Error;
use std::fs::File;
use std::path::{Path, PathBuf};
use std::io::BufReader;
use bincode::{deserialize_from, Infinite};
use super::*;
use scaii_core;


pub fn get_rust_ffi_config_for_path(path: &str) -> RustFfiConfig {
    RustFfiConfig {
        plugin_path: path.to_string(),
        init_as: protos::InitAs {
            init_as: Some(protos::init_as::InitAs::Backend(BackendInit {})),
        },
    }
}

pub fn create_rust_ffi_config_message(backend_path: &str) -> Result<ScaiiPacket, Box<Error>> {
    use scaii_defs::protos::plugin_type::PluginType;
    let path = Path::new(backend_path);
    if !path.exists() {
        return Err(Box::new(ReplayError::new(&format!(
            "specified backend does not exist {}",
            backend_path
        ))));
    }
    let rust_ffi_config = get_rust_ffi_config_for_path(backend_path);
    Ok(ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Core(CoreEndpoint {})),
        },
        specific_msg: Some(SpecificMsg::Config(Cfg {
            which_module: Some(WhichModule::CoreCfg(protos::CoreCfg {
                plugin_type: protos::PluginType {
                    plugin_type: Some(PluginType::RustPlugin(rust_ffi_config)),
                },
            })),
        })),
    })
}


#[allow(unused_assignments)]
pub fn create_rpc_config_message() -> Result<ScaiiPacket, Box<Error>> {
    let mut scaii_config: ScaiiConfig = scaii_core::load_scaii_config();

    let mut comm: Option<String> = None;
    if cfg!(target_os = "windows") {
        let windows_command_string = scaii_config.get_replay_browser();
        comm = Some(windows_command_string);
    } else if cfg!(target_os = "unix") {
        panic!("rpc config message for unix not yet implemented!");
    } else {
        // mac
        let mac_command_string = get_mac_browser_launch_command(&mut scaii_config)?;
        comm = Some(mac_command_string);
    }

    //
    // Add arguments on windows,but not mac
    //
    let mut vec: Vec<String> = Vec::new();
    if cfg!(target_os = "windows") {
        let target_url = scaii_config.get_full_replay_http_url();
        vec.push(target_url);
    } else if cfg!(target_os = "unix") {
        // will panic earlier in function if we are on unix
    } else {
        // mac adds no arguments - its all in command (workaround to browser launching issue on mac)
    }

    let rpc_config = scaii_core::get_rpc_config_for_viz(comm, vec);

    Ok(ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Core(CoreEndpoint {})),
        },
        specific_msg: Some(SpecificMsg::Config(Cfg {
            which_module: Some(WhichModule::CoreCfg(protos::CoreCfg {
                plugin_type: protos::PluginType {
                    plugin_type: Some(protos::plugin_type::PluginType::Rpc(rpc_config)),
                },
            })),
        })),
    })
}

pub fn wrap_packet_in_multi_message(pkt: ScaiiPacket) -> MultiMessage {
    let mut pkts: Vec<ScaiiPacket> = Vec::new();
    pkts.push(pkt);
    MultiMessage { packets: pkts }
}

pub fn load_replay_file(path: &Path) -> Result<Vec<ReplayAction>, Box<Error>> {
    //use super::ReplayAction;
    let replay_file = File::open(path).expect("file not found");
    let mut replay_vec: Vec<ReplayAction> = Vec::new();
    let mut reader = BufReader::new(replay_file);

    while let Ok(action) =
        deserialize_from::<BufReader<File>, ReplayAction, Infinite>(&mut reader, Infinite)
    {
        replay_vec.push(action);
    }
    let mut count = 0;
    println!("");
    println!("-------------------   Here are the replay actions with numbers  --------------------");
    for replay_action in &replay_vec {
        println!("{}   {:?}", count, replay_action);
        count = count + 1;
    }
    println!("");
    println!("");
    Ok(replay_vec)
}

pub fn load_replay_info_from_default_replay_path() -> Result<Vec<ReplayAction>, Box<Error>> {
    let path = scaii_core::get_default_replay_file_path()?;
    //load_replay_info_from_replay_file_path(path)
    load_replay_file(&path)
}
// pub fn load_replay_info_from_replay_file_path(path: PathBuf) -> Result<Vec<ReplayAction>, Box<Error>> {
//     let load_result = load_replay_file(&path);
//     match load_result {
//         Ok(replay_vec) => Ok(replay_vec),
//         Err(err) => Err(err),
//     }
// }

pub fn create_default_replay_backend_config() -> ScaiiPacket {
    let vec: Vec<u8> = Vec::new();
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        specific_msg: Some(SpecificMsg::Config(protos::Cfg {
            which_module: Some(WhichModule::BackendCfg(protos::BackendCfg {
                cfg_msg: Some(vec),
                is_replay_mode: true,
            })),
        })),
    }
}


pub fn get_mac_browser_launch_command(scaii_config: &mut ScaiiConfig) -> Result<String, Box<Error>> {
    let browser = scaii_config.get_replay_browser();
    let full_url = scaii_config.get_full_replay_http_url();
    Ok(format!("{} {}", browser, full_url))
}

pub fn set_replay_mode_on_backend_config(packet_option: &mut Option<ScaiiPacket>) {
    if let &mut Some(ScaiiPacket {
        specific_msg:
            Some(SpecificMsg::Config(protos::Cfg {
                which_module:
                    Some(WhichModule::BackendCfg(protos::BackendCfg {
                        ref mut is_replay_mode,
                        ..
                    })),
            })),
        ..
    }) = packet_option
    {
        *is_replay_mode = true;
    }
}

pub fn get_replay_mode_pkt() -> ScaiiPacket {
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        specific_msg: Some(SpecificMsg::ReplayMode(true)),
    }
}

pub fn get_emit_viz_pkt() -> ScaiiPacket {
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        specific_msg: Some(SpecificMsg::EmitViz(true)),
    }
}

pub fn get_replay_configuration_message(replay_data: &Vec<ReplayAction>) -> ScaiiPacket {
    let mut expl_titles: Vec<String> = Vec::new();
    let mut chart_titles: Vec<String> = Vec::new();
    let mut expl_steps: Vec<u32> = Vec::new();
    let steps = replay_data.len() as i64;
    expl_titles.push("actionA".to_string());
    expl_steps.push(0);
    chart_titles.push("chartA".to_string());
    let spkt = create_replay_session_config_message(steps, expl_steps, expl_titles, chart_titles);
    spkt
}

pub fn create_replay_session_config_message(
    steps: i64,
    expl_steps: Vec<u32>,
    expl_titles: Vec<String>,
    chart_titles: Vec<String>,
) -> ScaiiPacket {
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Module(ModuleEndpoint {
                name: "viz".to_string(),
            })),
        },
        specific_msg: Some(SpecificMsg::ReplaySessionConfig(ReplaySessionConfig {
            step_count: steps,
            explanation_steps: expl_steps,
            explanation_titles: expl_titles,
            chart_titles: chart_titles,
        })),
    }
}