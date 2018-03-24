extern crate toml;

use std::path::PathBuf;
use super::util;
use std::error::Error;
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
    #[serde(default = "default_browser")] browser: String,
    #[serde(default = "default_url")] url: String,
    #[serde(default = "default_port")] port: String,
}

#[cfg(target_os = "windows")]
fn default_browser() -> String {
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe".to_string()
}
#[cfg(target_os = "macos")]
fn default_browser() -> String {
    "open".to_string() // will open url in safari
}
#[cfg(target_os = "linux")]
fn default_browser() -> String {
    "/usr/bin/chrome".to_string()
}

fn default_url() -> String {
    "localhost".to_string()
}

fn default_port() -> String {
    "8000".to_string()
}

#[allow(unused_assignments)]
pub fn load_scaii_config() -> ScaiiConfig {
    use std::fs::File;
    use std::io::prelude::*;
    // create the path to cfg.toml
    let scaii_root_result = util::get_scaii_root();
    let mut config_file_pathbuf: PathBuf = PathBuf::new();
    match scaii_root_result {
        Ok(root) => {
            config_file_pathbuf = root;
        }
        Err(_) => {
            panic!("Could not determine SCAII root directory while loading config file");
        }
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
                Ok(_) => {}
                //Ok(_) => { return default_scaii_config ;},
                Err(_) => {
                    println!(
                        "Problem reading data from config file {:?}.  Will try default values.",
                        config_file_pathbuf.as_path()
                    );
                    return default_scaii_config;
                }
            }
            let scaii_config_parse_result = toml::from_str(&config_data);

            match scaii_config_parse_result {
                Ok(parsed_scaii_config) => {
                    return parsed_scaii_config;
                }
                Err(error) => {
                    println!(
                        "Problem parsing data from config file {:?}.  Will try default values. {:?}",
                        config_file_pathbuf.as_path(),
                        error.description()
                    );
                    return default_scaii_config;
                }
            }
        }
        Err(error) => {
            println!(
                "config file {:?} not found.  Will use default values. {:?}",
                config_file_pathbuf.as_path(),
                error
            );
            default_scaii_config
        }
    }
}

fn get_default_scaii_config() -> ScaiiConfig {
    ScaiiConfig {
        replay: Some(ReplayConfig {
            browser: default_browser(),
            url: default_url(),
            port: default_port(),
        }),
    }
}

impl ScaiiConfig {
    pub fn get_replay_url(&mut self) -> String {
        match &self.replay {
            &None => default_url(),
            &Some(ref replay) => replay.url.clone(),
        }
    }

    pub fn get_replay_port(&mut self) -> String {
        match &self.replay {
            &None => default_port(),
            &Some(ref replay) => replay.port.clone(),
        }
    }

    pub fn get_replay_browser(&mut self) -> String {
        match &self.replay {
            &None => default_browser(),
            &Some(ref replay) => replay.browser.clone(),
        }
    }

    pub fn get_full_replay_http_url(&mut self) -> String {
        let url = self.get_replay_url();
        let port = self.get_replay_port();
        return format!("http://{}:{}", url, port);
    }
}
