use std::process::Command;
use std::env;
use std::fmt;
use std::error::Error;
use std::path::PathBuf;

#[derive(Debug)]
pub struct ScaiiError {
    details: String,
}

impl ScaiiError {
    pub fn new(msg: &str) -> ScaiiError {
        ScaiiError {
            details: msg.to_string(),
        }
    }
}

impl fmt::Display for ScaiiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.details)
    }
}

impl Error for ScaiiError {
    fn description(&self) -> &str {
        &self.details
    }
}

#[cfg(target_os = "windows")]
fn run_command_platform(
    command: &String,
    args: Vec<String>,
    where_to_read_output: &str,
) -> Result<String, Box<Error>> {
    let mut c = Command::new("cmd");
    let c = c.arg("/C");
    let c = c.arg(command);
    for arg in args.iter() {
        c.arg(arg);
    }
    let output = c.output().expect(&String::as_str(&format!(
        "failed to launch command {}",
        command
    )));
    if output.status.success() {
        let mut result = String::from_utf8(output.stdout);
        if where_to_read_output == "stderr" {
            result = String::from_utf8(output.stderr);
        }
        match result {
            Ok(output_string) => Ok(output_string),
            Err(_utf8_convert_error) => Err(Box::new(ScaiiError::new(
                "problem converting command result from utf8",
            ))),
        }
    } else {
        Err(Box::new(ScaiiError::new(&String::from_utf8_lossy(
            &output.stderr,
        ))))
    }
}

#[cfg(target_os = "linux")]
fn run_command_platform(
    command: &String,
    args: Vec<String>,
    where_to_read_output: &str,
) -> Result<String, Box<Error>> {
    use std::process::{Command, Stdio};
    let mut c = Command::new(command);
    for arg in args.iter() {
        c.arg(arg);
    }
    println!("...running command {:?}", c);
    let output = c.output().expect(&String::as_str(&format!(
        "failed to launch command {}",
        command
    )));
    if output.status.success() {
        let mut result = String::from_utf8(output.stdout);
        if where_to_read_output == "stderr" {
            result = String::from_utf8(output.stderr);
        }
        match result {
            Ok(output_string) => Ok(output_string),
            Err(_utf8_convert_error) => Err(Box::new(ScaiiError::new(
                "problem converting command result from utf8",
            ))),
        }
    } else {
        Err(Box::new(ScaiiError::new(&String::from_utf8_lossy(
            &output.stderr,
        ))))
    }
}

#[cfg(target_os = "macos")]
fn run_command_platform(
    command: &String,
    args: Vec<String>,
    where_to_read_output: &str,
) -> Result<String, Box<Error>> {
    // note - using the sh -c approach on Mac caused the chmod command to fail.  Leaving them out
    // let it succeed, so left it that way assuming all commands would be similar.
    //let mut c = Command::new("sh");
    //let c = c.arg("-c");
    //let c = c.arg(command);
    let mut c = Command::new(command);
    for arg in args.iter() {
        c.arg(arg);
    }
    let output = c.output().expect(&String::as_str(&format!(
        "failed to launch command {}",
        command
    )));
    if output.status.success() {
        let mut result = String::from_utf8(output.stdout);
        if where_to_read_output == "stderr" {
            result = String::from_utf8(output.stderr);
        }
        match result {
            Ok(output_string) => Ok(output_string),
            Err(_utf8_convert_error) => Err(Box::new(ScaiiError::new(
                "problem converting command result from utf8",
            ))),
        }
    } else {
        Err(Box::new(ScaiiError::new(&String::from_utf8_lossy(
            &output.stderr,
        ))))
    }
}

pub fn run_command(command: &String, args: Vec<String>) -> Result<String, Box<Error>> {
    let hard_coded_protoc_command = String::from("protoc");
    let mut final_command: &String = &command.clone();
    if command == "\"protoc\"" {
        // has extra quotes that I can't figure out how to prevent (from PathBug)
        final_command = &hard_coded_protoc_command;
    }

    run_command_platform(final_command, args, "stdout")
}

// to discover python version in play have to read stderr as "python --version" emits there!
pub fn run_command_read_stderr(command: &String, args: Vec<String>) -> Result<String, Box<Error>> {
    let hard_coded_protoc_command = String::from("protoc");
    let mut final_command: &String = &command.clone();
    if command == "\"protoc\"" {
        // has extra quotes that I can't figure out how to prevent (from PathBug)
        final_command = &hard_coded_protoc_command;
    }

    run_command_platform(final_command, args, "stderr")
}

pub fn get_scaii_root() -> Result<PathBuf, Box<Error>> {
    //look upwardfrom current dir until find valid parent.
    let current_dir = env::current_dir()?;
    let mut candidate_dir: PathBuf = current_dir.clone();
    let mut seeking = true;
    while seeking {
        let is_dir_scaii_root = is_dir_scaii_root(&candidate_dir);
        if is_dir_scaii_root {
            seeking = false;
        } else {
            let candidate_clone = candidate_dir.clone();
            let parent_search_result = candidate_clone.parent();
            match parent_search_result {
                Some(parent_path) => {
                    candidate_dir = parent_path.clone().to_path_buf();
                }
                None => {
                    return Err(Box::new(ScaiiError::new(&format!(
                        "cannot find scaii_root above current directory {:?}",
                        current_dir
                    ))));
                }
            }
        }
    }
    Ok(candidate_dir)
}

fn is_dir_scaii_root(dir: &PathBuf) -> bool {
    let mut candidate_dir = dir.clone();
    candidate_dir.push("core");
    let core_dir_exists = candidate_dir.exists();

    let mut candidate_dir = dir.clone();
    candidate_dir.push("common_protos");
    let common_protos_dir_exists = candidate_dir.exists();

    core_dir_exists && common_protos_dir_exists
}

#[cfg(target_os = "macos")]
pub fn get_default_backend() -> Result<String, Box<Error>> {
    //$HOME/.scaii/backends/bin/sky_rts.dll
    use std::env;

    let mut path_option = env::home_dir();
    match path_option {
        None => Err(Box::new(ScaiiError::new(&format!(
            "ERROR - Could not find default backend because could not determine home directory."
        )))),
        Some(ref mut path_buf) => {
            path_buf.push(".scaii".to_string());
            path_buf.push("backends".to_string());
            path_buf.push("bin".to_string());
            path_buf.push("sky-rts".to_string());
            Ok(path_buf.to_str().unwrap().to_string())
        }
    }
}
#[cfg(target_os = "windows")]
pub fn get_default_backend() -> Result<String, Box<Error>> {
    //$HOME/.scaii/backends/bin/sky_rts.dll
    use std::env;

    let mut path_option = env::home_dir();
    match path_option {
        None => Err(Box::new(ScaiiError::new(&format!(
            "ERROR - Could not find default backend because could not determine home directory."
        )))),
        Some(ref mut path_buf) => {
            path_buf.push(".scaii".to_string());
            path_buf.push("backends".to_string());
            path_buf.push("bin".to_string());
            path_buf.push("sky-rts.dll".to_string());
            Ok(path_buf.to_str().unwrap().to_string())
        }
    }
}
#[cfg(target_os = "linux")]
pub fn get_default_backend() -> Result<String, Box<Error>> {
    Err(Box::new(ScaiiError::new(&format!(
        "linux replay not yet implemented"
    ))))
}
