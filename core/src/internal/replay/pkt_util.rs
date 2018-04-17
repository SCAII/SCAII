use protos::{BackendEndpoint, Cfg, CoreEndpoint, ModuleEndpoint, MultiMessage, PluginType,
             ReplayEndpoint,ReplayChoiceConfig, ReplaySessionConfig, ScaiiPacket};
use protos::cfg::WhichModule;
use protos::plugin_type::PluginType::SkyRts;
use protos::endpoint::Endpoint;
use protos::scaii_packet::SpecificMsg;
use scaii_core::{ActionWrapper, ScaiiConfig};
use scaii_defs::protos;
use std::error::Error;
use super::*;
use scaii_core;

pub fn adjust_cfg_packets(
    cfg_pkts: Vec<ScaiiPacket>,
    replay_session_cfg_pkt_for_ui: ScaiiPacket,
    test_mode: &bool,
) -> Result<Vec<ScaiiPacket>, Box<Error>> {
    use super::replay_util;
    use protos::Cfg;
    let mut temp_vec: Vec<ScaiiPacket> = Vec::new();
    let mut result_vec: Vec<ScaiiPacket> = Vec::new();
    let mut rust_ffi_config_pkt: Option<ScaiiPacket> = None;
    let mut backend_config_pkt: Option<ScaiiPacket> = None;

    for pkt in cfg_pkts {
        match pkt.specific_msg {
            Some(SpecificMsg::Config(Cfg {
                which_module: Some(WhichModule::BackendCfg(protos::BackendCfg { .. })),
            })) => {
                backend_config_pkt = Some(pkt);
            }
            Some(SpecificMsg::Config(Cfg {
                which_module:
                    Some(WhichModule::CoreCfg(protos::CoreCfg {
                        plugin_type:
                            PluginType {
                                plugin_type: Some(SkyRts(protos::SkyRts {})),
                            },
                    })),
            })) => {
                rust_ffi_config_pkt = Some(pkt);
            }
            _ => {
                temp_vec.push(pkt);
            }
        }
    }

    if rust_ffi_config_pkt == None && !test_mode {
        rust_ffi_config_pkt = Some(pkt_util::create_rts_backend_msg()?);
    }

    if backend_config_pkt == None {
        backend_config_pkt = Some(pkt_util::create_default_replay_backend_config());
    } else {
        // need to change replay_mode to true
        replay_util::set_replay_mode_on_backend_config(&mut backend_config_pkt);
    }

    if !test_mode {
        result_vec.push(rust_ffi_config_pkt.unwrap());
    }

    // next send replay_mode == true signal
    let replay_mode_pkt = pkt_util::get_replay_mode_pkt();
    result_vec.push(replay_mode_pkt);
    // then send ReplaySessionConfig pkt to UI
    result_vec.push(replay_session_cfg_pkt_for_ui);
    // then send emit_viz directive
    let emit_viz_pkt = pkt_util::get_emit_viz_pkt();
    result_vec.push(emit_viz_pkt);
    result_vec.push(backend_config_pkt.unwrap());
    for pkt in temp_vec {
        result_vec.push(pkt);
    }
    Ok(result_vec)
}

pub fn get_mac_browser_launch_command(
    scaii_config: &mut ScaiiConfig,
) -> Result<String, Box<Error>> {
    let browser = scaii_config.get_replay_browser();
    let full_url = scaii_config.get_full_replay_http_url();
    Ok(format!("{} {}", browser, full_url))
}

pub fn wrap_response_in_scaii_pkt(ser_response: protos::SerializationResponse) -> ScaiiPacket {
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        specific_msg: Some(scaii_defs::protos::scaii_packet::SpecificMsg::SerResp(
            ser_response,
        )),
    }
}

pub fn convert_action_wrapper_to_action_pkt(
    action_wrapper: ActionWrapper,
) -> Result<ScaiiPacket, Box<Error>> {
    use prost::Message;
    let data = action_wrapper.serialized_action;
    let action_decode_result = protos::Action::decode(data);
    match action_decode_result {
        Ok(protos_action) => Ok(ScaiiPacket {
            src: protos::Endpoint {
                endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
            },
            dest: protos::Endpoint {
                endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
            },
            specific_msg: Some(scaii_defs::protos::scaii_packet::SpecificMsg::Action(
                protos_action,
            )),
        }),
        Err(err) => Err(Box::new(err)),
    }
}

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


pub fn create_rts_backend_msg() -> Result<ScaiiPacket, Box<Error>> {
    use scaii_defs::protos::PluginType;

    Ok(ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Core(CoreEndpoint {})),
        },
        specific_msg: Some(SpecificMsg::Config(Cfg {
            which_module: Some(WhichModule::CoreCfg(protos::CoreCfg {
                plugin_type: PluginType {
                    plugin_type: Some(SkyRts(protos::SkyRts {})),
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


#[allow(dead_code)]
pub fn get_reset_env_pkt() -> ScaiiPacket {
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Backend(BackendEndpoint {})),
        },
        specific_msg: Some(SpecificMsg::ResetEnv(true)),
    }
}

pub fn get_replay_choice_config_message(replay_filenames : Vec<String>) -> ScaiiPacket {
    ScaiiPacket {
        src: protos::Endpoint {
            endpoint: Some(Endpoint::Replay(ReplayEndpoint {})),
        },
        dest: protos::Endpoint {
            endpoint: Some(Endpoint::Module(ModuleEndpoint {
                name: "viz".to_string(),
            })),
        },
        specific_msg: Some(SpecificMsg::ReplayChoiceConfig(ReplayChoiceConfig {
            replay_filenames: replay_filenames,
        })),
    }
}



pub fn get_replay_configuration_message(
    count: u32,
    explanations_option: &Option<Explanations>,
) -> ScaiiPacket {
    let mut expl_titles: Vec<String> = Vec::new();
    let chart_titles: Vec<String> = Vec::new();
    let mut expl_steps: Vec<u32> = Vec::new();

    match explanations_option {
        &None => {}
        &Some(ref explanations) => {
            println!("...adding expl info to config message...");
            for index in &explanations.step_indices {
                expl_steps.push(index.clone());
                let expl_point_option = &explanations.expl_map.get(index);
                let title_option = &expl_point_option.unwrap().title;
                let title = title_option.clone().unwrap();
                println!("......step_index {} title{} ", index, title);
                expl_titles.push(title);
            }
        }
    }

    let steps = count as i64;
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