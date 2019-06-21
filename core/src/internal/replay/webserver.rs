//extern crate scaii_core;
//#[macro_use]
//extern crate serde_derive;

use scaii_core::scaii_config;
use scaii_core::util;
use scaii_core::{ScaiiConfig, ScaiiError};
use std::env;
use std::error::Error;
use std::process;

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

fn get_python_version(python_command: String) -> Option<String> {
    use std::process::{Command, Stdio};

    let output_stdout = Command::new(&python_command)
        .arg("--version")
        .stdout(Stdio::piped())
        .output()
        .expect("Failed to execute command");

    let result = String::from_utf8_lossy(&output_stdout.stdout);

    if result.starts_with("Python 3") {
        return Some("3".to_string());
    } else {
        let output_stderr = Command::new(&python_command) // Python 3.4 outputs to stderr
            .arg("--version")
            .stderr(Stdio::piped())
            .output()
            .expect("Failed to execute command");

        let result = String::from_utf8_lossy(&output_stderr.stderr);
        if result.starts_with("Python 3") {
            return Some("3".to_string());
        }
    }
    None
}

fn change_to_viz_dir() -> Result<(), Box<Error>> {
    //cd <SCAII_ROOT>\viz
    let mut root = util::get_exec_dir()?;
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
    println!("current dir is {:?}", env::current_dir());
    let port = scaii_config.get_replay_port();
    let command = python_command.to_string();
    let mut args: Vec<String> = Vec::new();
    //args.push("-m".to_string());
    let mut path = util::get_exec_dir().unwrap();
    path.push("core/src/internal/replay/no_cache_webserver.py");
    let path = path.canonicalize().unwrap();
    args.push(path.to_str().unwrap().to_owned());
    //args.push(".\\no_cache_webserver.py".to_string());
    //args.push("http.server".to_string());
    //args.push("-c-1".to_string());
    //args.push("-p".to_string());
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
