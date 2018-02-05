// For clippy
#![allow(unknown_lints)]

#[macro_use]
extern crate lazy_static;
extern crate libc;
extern crate libloading;
extern crate prost;
extern crate scaii_defs;
#[macro_use]
extern crate serde_derive;
extern crate serde;
extern crate bincode;
extern crate websocket;
extern crate toml;
use scaii_defs::protos::{AgentEndpoint, MultiMessage, ScaiiPacket};
use std::error::Error;
use internal::router::Router;
use internal::agent::PublisherAgent;
use std::rc::Rc;
use std::cell::RefCell;
use std::fmt;
use std::path::PathBuf;
//use serde::Deserialize;

#[cfg(feature = "c_api")]
mod c_api;
#[cfg(feature = "c_api")]
pub use c_api::*;


// Don't publicly expose our internal structure to FFI
pub(crate) mod internal;
//...but expose ReplayAction so Replay can access it in Recorder (Replay is a binary so different crate)
pub use internal::recorder::{GameAction, get_default_replay_file_path, ReplayAction, ReplayHeader, SerializedProtosAction, 
                SerializedProtosEndpoint, SerializedProtosScaiiPacket,
                SerializedProtosSerializationResponse, SerializationInfo};
pub use internal::rpc::get_rpc_config_for_viz;


#[derive(Debug)]
struct ScaiiError {
    details: String
}

impl ScaiiError {
    fn new(msg: &str) -> ScaiiError {
        ScaiiError{details: msg.to_string()}
    }
}

impl fmt::Display for ScaiiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f,"{}",self.details)
    }
}

impl Error for ScaiiError {
    fn description(&self) -> &str {
        &self.details
    }
}


/// The Environment created by this library.
#[derive(Default)]
pub struct Environment {
    router: Router,
}

const FATAL_OWNER_ERROR: &'static str = "FATAL CORE ERROR: Cannot forward message to owner";

impl Environment {
    pub fn new() -> Self {
        Environment {
            router: Router::new(),
        }
    }

    pub fn agent_owned() -> (Self, Rc<RefCell<PublisherAgent>>) {
        let agent = Rc::new(RefCell::new(PublisherAgent::new()));
        let me = Environment {
            router: Router::from_agent(Box::new(Rc::clone(&agent))),
        };

        (me, agent)
    }

    pub fn router(&self) -> &Router {
        &self.router
    }

    pub fn router_mut(&mut self) -> &mut Router {
        &mut self.router
    }

    pub fn update(&mut self) {
        let core_msgs = self.router.process_module_messages();
        self.process_core_messages(core_msgs);
    }

    pub fn route_messages(&mut self, msg: &MultiMessage) {
        let core_msgs = self.router.decode_and_route(msg);
        self.process_core_messages(core_msgs);
    }

    /// Processes all messages returned by module message processing routed to
    /// "core"
    fn process_core_messages(&mut self, packets: Vec<ScaiiPacket>) {
        use scaii_defs::protos::scaii_packet::SpecificMsg;
        use scaii_defs::protos::{Cfg, CoreCfg, PluginType};
        use scaii_defs::protos::cfg::WhichModule;
        for packet in packets {
            if packet.specific_msg.is_none() {
                self.handle_errors_possible_failure(
                    &packet,
                    "Specific Message field has invalid variant",
                );
            }

            match packet.specific_msg.clone().unwrap() {
                SpecificMsg::Err(_) => self.forward_err_to_owner(&mut packet.clone()),
                SpecificMsg::Config(Cfg {
                    which_module:
                        Some(
                            WhichModule::CoreCfg(CoreCfg {
                                plugin_type:
                                    PluginType {
                                        plugin_type: Some(ref mut plugin_type),
                                    },
                            }),
                        ),
                }) => {
                    let res = self.load_cfg(plugin_type);
                    if let Err(err) = res {
                        self.handle_errors_possible_failure(
                            &packet,
                            &format!("Could not complete configuration: {}", err),
                        );
                    }
                }
                SpecificMsg::Config(Cfg {
                    which_module: Some(_),
                }) => self.handle_errors_possible_failure(
                    &packet,
                    "Core only handles correctly formed CoreCfg config messages.",
                ),
                _ => {
                    self.handle_errors_possible_failure(&packet, "Message type not suited for Core")
                }
            }
        }
    }

    fn load_cfg(
        &mut self,
        plugin_type: &mut scaii_defs::protos::plugin_type::PluginType,
    ) -> Result<(), Box<Error>> {
        use scaii_defs::protos::plugin_type::PluginType::*;
        use internal::{rpc, rust_ffi};
        use internal::LoadedAs;

        match *plugin_type {
            RustPlugin(ref cfg) => match rust_ffi::init_ffi(cfg.clone())? {
                LoadedAs::Backend(backend) => {
                    let prev = self.router.register_backend(backend);
                    if prev.is_some() {
                        Err("Backend previously registered, overwriting".to_string())?
                    } else {
                        Ok(())
                    }
                }
                LoadedAs::Module(module, name) => {
                    let prev = self.router.register_module(name.clone(), module);
                    if prev.is_some() {
                        Err(format!(
                            "Module {} previously registered, overwriting",
                            name
                        ))?
                    } else {
                        Ok(())
                    }
                }
            },
            Rpc(ref cfg) => match rpc::init_rpc(cfg)? {
                LoadedAs::Backend(_) => unimplemented!(),
                LoadedAs::Module(module, name) => {
                    let prev = self.router.register_module(name.clone(), module);
                    if prev.is_some() {
                        Err(format!(
                            "Module {} previously registered, overwriting",
                            name
                        ))?
                    } else {
                        Ok(())
                    }
                }
            },
        }
    }

    /// Handles error forwarding. First it tries the module the packet originated from,
    /// and if it can't get a hold of that it tries the owner.
    /// Otherwise, it panics because something very bad has happened.
    fn handle_errors_possible_failure(&mut self, packet: &ScaiiPacket, descrip: &str) {
        use scaii_defs::protos::endpoint::Endpoint;
        use scaii_defs::protos::CoreEndpoint;

        let error_src = packet.src.endpoint.as_ref().unwrap();
        let res = self.router
            .send_error(descrip, error_src, &Endpoint::Core(CoreEndpoint {}));

        if let Err(err) = res {
            self.router
                .send_error(
                    &format!(
                        "{};\n\
                         The module who made this mistake no longer exists: {}",
                        descrip,
                        err
                    ),
                    error_src,
                    &Endpoint::Core(CoreEndpoint {}),
                )
                .expect(&format!(
                    "{}:\n\t(Original Error): {}",
                    FATAL_OWNER_ERROR,
                    err
                ));
            return;
        }
    }

    /// Forwards an error to the owner of this environment,
    /// panicking on failure because something has gone very wrong.
    fn forward_err_to_owner(&mut self, packet: &mut ScaiiPacket) {
        use scaii_defs::protos::endpoint;
        use scaii_defs::protos;

        let dest = protos::Endpoint {
            endpoint: Some(endpoint::Endpoint::Agent(AgentEndpoint {})),
        };
        packet.dest = dest;
        self.router.route_to(packet).expect(FATAL_OWNER_ERROR);
    }
}

//[replay]
//browser = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
//url = "localhost"
//port = "8000"
#[derive(Deserialize, Debug)]
pub struct ScaiiConfig {
    replay: Option<ReplayConfig>,
}
#[derive(Deserialize, Debug)]
struct ReplayConfig {
    #[serde(default = "default_browser")]
    browser: String,
    #[serde(default = "default_url")]
    url: String,
    #[serde(default = "default_port")]
    port: String,
}


#[cfg(target_os="windows")]
fn default_browser() -> String {
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe".to_string()
}
#[cfg(target_os="macos")]
fn default_browser() -> String {
    "/Applications/Google Chrome.app".to_string();
}
#[cfg(target_os="linux")]
fn default_browser() -> String {
    "/usr/bin/chrome".to_string()
}

fn default_url() -> String {
    "localhost".to_string()
}

fn default_port() -> String {
    "8000".to_string()
}

fn get_scaii_root() -> Result<PathBuf, Box<Error>> {
    use std::env;
    //look at current dir, see if peer directories are as expected, if so use parent.
    let mut parent_dir: PathBuf = env::current_dir()?;
    // find parent
    parent_dir.pop();

    let mut core_dir = parent_dir.clone();
    core_dir.push("core");
    if !core_dir.exists() {
        return Err(Box::new(ScaiiError::new("core directory could not be found, coult not verify SCAII_ROOT")));
    }
    let mut common_protos_dir = parent_dir.clone();
    common_protos_dir.push("common_protos");
    if !common_protos_dir.exists() {
        return Err(Box::new(ScaiiError::new("common_protos directory could not be found, coult not verify SCAII_ROOT")));
    }
    Ok(parent_dir)
}
#[allow(unused_assignments)]
pub fn load_scaii_config() -> Result<ScaiiConfig, Box<Error>> {
    use std::fs::File;
    use std::io::prelude::*;
    // create the path to cfg.toml
    let scaii_root_result  = get_scaii_root();
    let mut config_file_pathbuf : PathBuf = PathBuf::new();
    match scaii_root_result {
        Ok(root) => { config_file_pathbuf = root; }
        Err(_)=> {  panic!("Could not determine SCAII root directory while loading config file"); }
    }
    config_file_pathbuf.push("cfg.toml");
    // try loading the cfg.toml file
    let file_open_result = File::open(config_file_pathbuf.as_path());
    let default_scaii_config = get_default_scaii_config();
    match file_open_result {
        Ok(mut config_file) => {
            // read the contents
            let mut config_data = String::new();
            let read_result = config_file.read_to_string(&mut config_data);
            match read_result {
                Ok(_) => { },
                Err(_) => {
                    println!("Problem reading data from config file {:?}.  Will try default values.", config_file_pathbuf.as_path());
                    return Ok(default_scaii_config) ;
                }
            }
            let scaii_config_parse_result = toml::from_str(&config_data);
            match scaii_config_parse_result {
                Ok(parsed_scaii_config) => {
                    return parsed_scaii_config;
                }
                Err(error) => {
                    println!("Problem parsing data from config file {:?}.  Will try default values. {:?}", config_file_pathbuf.as_path(), error.description());
                    return Ok(default_scaii_config) ;
                }
            }
        }
        Err(error) => {
            println!("config file {:?} not found.  Will use default values. {:?}", config_file_pathbuf.as_path(),error);
            return Ok(default_scaii_config) 
        }
    }
}

fn get_default_scaii_config() -> ScaiiConfig {
    ScaiiConfig {
        replay : Some(ReplayConfig {
            browser: default_browser(),
            url: default_url(),
            port: default_port(),
        })
    }
}

impl ScaiiConfig {
    pub fn get_replay_url(&mut self) -> String {
        match &self.replay {
            &None => { default_url() },
            &Some(ref replay) => {
                replay.url.clone()
            }
        }
    }
    pub fn get_replay_port(&mut self) -> String {
        match &self.replay {
            &None => { default_port() },
            &Some(ref replay) => {
                replay.port.clone()
            }
        }
    }
    pub fn get_replay_browser(&mut self) -> String {
        match &self.replay {
            &None => { default_browser() },
            &Some(ref replay) => {
                replay.browser.clone()
            }
        }
    }
}


