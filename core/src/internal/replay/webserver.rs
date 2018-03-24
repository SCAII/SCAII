//extern crate scaii_core;
//#[macro_use]
//extern crate serde_derive;

use std::process;
use std::env;
use std::error::Error;
use scaii_core::{ScaiiConfig, ScaiiError};
use scaii_core::util;
use scaii_core::scaii_config;

// launch the simple python webserver if python3 installed
pub fn launch_webserver() {
    let python3_command_result = get_python3_command();
    match python3_command_result {
        Some(python_command) => match python_command.as_ref() {
            "python" => {
                let cd_result = change_to_viz_dir();
                match cd_result {
                    Ok(_) => {
                        launch_webserver_using_command("python");
                    }
                    Err(error) => {
                        println!(
                            "failed to cd into viz directory to launch webserver... {:?}",
                            error.description()
                        );
                        process::exit(0);
                    }
                }
            }
            "python3" => {
                let cd_result = change_to_viz_dir();
                match cd_result {
                    Ok(_) => {
                        launch_webserver_using_command("python3");
                    }
                    Err(error) => {
                        println!(
                            "failed to cd into viz directory to launch webserver... {:?}",
                            error.description()
                        );
                        process::exit(0);
                    }
                }
            }
            _ => {
                println!("ERROR - Python3 is required to run SCAII.");
                process::exit(0);
            }
        },
        _ => {
            println!("ERROR - Python3 is required to run SCAII.");
            process::exit(0);
        }
    }
}

fn get_python3_command() -> Option<String> {
    if is_python3_invoked_as_python() {
        return Some("python".to_string());
    }
    if is_python3_invoked_as_python3() {
        return Some("python3".to_string());
    }
    None
}

fn is_python3_invoked_as_python() -> bool {
    let version_option = get_python_version("python".to_string());
    match version_option {
        Some(version) => match version.as_ref() {
            "3" => true,
            _ => false,
        },
        _ => false,
    }
}

fn is_python3_invoked_as_python3() -> bool {
    let version_option = get_python_version("python3".to_string());
    match version_option {
        Some(version) => match version.as_ref() {
            "3" => true,
            _ => false,
        },
        _ => false,
    }
}

#[cfg(windows)]
fn get_python_version(python_command: String) -> Option<String> {
    let mut args: Vec<String> = Vec::new();
    args.push("--version".to_string());
    let command_result = util::run_command_read_stderr(&python_command, args);
    match command_result {
        Ok(result_string) => {
            if result_string.starts_with("Python 3") {
                Some("3".to_string())
            } else {
                println!("no python3 detected");
                None
            }
        }
        Err(_) => None,
    }
}

#[cfg(unix)]
fn get_python_version(python_command: String) -> Option<String> {
    let mut args: Vec<String> = Vec::new();
    args.push("--version".to_string());
    let command_result = util::run_command(&python_command, args); // This is the only line that
    match command_result {
        // changes, potential area for
        Ok(result_string) => {
            // consolidation during refactor.
            if result_string.starts_with("Python 3") {
                Some("3".to_string())
            } else {
                println!("no python3 detected");
                None
            }
        }
        Err(_) => None,
    }
}

fn change_to_viz_dir() -> Result<(), Box<Error>> {
    //cd <SCAII_ROOT>\viz
    let mut root = util::get_scaii_root()?;
    root.push("viz");
    if env::set_current_dir(&root.as_path()).is_ok() {
        Ok(())
    } else {
        Err(Box::new(ScaiiError::new(&format!(
            "could not set_current_dir to {:?}",
            root.as_path()
        ))))
    }
}

fn launch_webserver_using_command(python_command: &str) {
    //python -m http.server <port>
    let mut scaii_config: ScaiiConfig = scaii_config::load_scaii_config();
    let port = scaii_config.get_replay_port();
    let command = python_command.to_string();
    let mut args: Vec<String> = Vec::new();
    args.push("-m".to_string());
    args.push("http.server".to_string());
    args.push(port);
    let run_result = util::run_command(&command, args);
    match run_result {
        Ok(_) => {}
        Err(error) => {
            println!(
                "Error - problem launching SCAII simple web server: {:?}",
                error.description()
            );
        }
    }
}
