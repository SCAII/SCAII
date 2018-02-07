extern crate docopt;
extern crate scaii_core;
#[macro_use]
extern crate serde_derive;

use std::process;
use std::env;
use std::error::Error;
use scaii_core::{ScaiiConfig, ScaiiError};
use scaii_core::util;

use docopt::Docopt;


const USAGE: &'static str = "
replay_webserver.

Usage:
  replay_webserver webserver <port>
  replay_webserver file [--filename <path-to-replay-file>]
  replay_webserver runtest [--data-hardcoded | --data-from-recorded-file]
  replay_webserver (-h | --help)

Options:
  -h --help                     Show this screen.
  --data_hardcoded              data generated within test.
  --data_from_recorded_file     data generated by recorder test.
";

#[derive(Debug, Deserialize)]
struct Args {
    cmd_webserver: bool,
    arg_port: String,
    //
    cmd_runtest: bool,
    flag_data_from_recorded_file: bool,
    flag_data_hardcoded: bool,
    //
    cmd_file: bool,
    flag_filename: bool,
    arg_path_to_replay_file: String,
}

// launch the simple python webserver if python3 installed
fn main() {
    let args: Args = Docopt::new(USAGE)
        .and_then(|d| d.deserialize())
        .unwrap_or_else(|e| e.exit());
    println!("{:?}", args);
    // let docopt = match Docopt::new(USAGE) {
    //     Ok(d) => d,
    //     Err(e) => e.exit(),
    // };
    // println!("{:?}", docopt);
    // let args: Args = match docopt.deserialize() {
    //     Ok(args) => println!("ARGS : {:?}",args),
    //     Err(e) => e.exit(),
    // };
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
    let mut args: Vec<String> = Vec::new();
    args.push("--version".to_string());
    let command_result = scaii_core::util::run_command_read_stderr(&python_command, args);
    match command_result {
        Ok(result_string) => if result_string.starts_with("Python 3") {
            println!("python 3 detected");
            Some("3".to_string())
        } else {
            println!("no python3 detected");
            None
        },
        Err(_) => None,
    }
}
fn change_to_viz_dir() -> Result<(), Box<Error>> {
    //cd <SCAII_ROOT>\viz
    let mut root = scaii_core::util::get_scaii_root()?;
    root.push("viz");
    if env::set_current_dir(&root.as_path()).is_ok() {
        println!("current dir is now {:?}", env::current_dir()?);
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
    let mut scaii_config: ScaiiConfig = scaii_core::load_scaii_config();
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
