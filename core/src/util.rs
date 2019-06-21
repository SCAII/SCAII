use std::env;
use std::error::Error;
use std::fmt;
use std::path::PathBuf;
use std::process::Command;

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

/// There's a simple priority system in play for determining executable
/// directories:
///
///     1. Our directory, or a parent of ours, is executable, this handles development execution.
///     2. The proper directory is $SCAII_ROOT/bin/..., make sure it's installed properly
pub fn get_exec_dir() -> Result<PathBuf, Box<Error>> {
    let mut pwd = env::current_dir()?.to_path_buf();

    if let Ok(pwd) = is_valid_exec_dir(&mut pwd) {
        return Ok(pwd.clone());
    }

    while pwd.pop() {
        if let Ok(pwd) = is_valid_exec_dir(&mut pwd) {
            return Ok(pwd.clone());
        }
    }

    println!(
        "Could not find valid replay executable directory in parent tree, \
         testing for install"
    );

    #[allow(deprecated)]
    let mut install_dir = env::home_dir().ok_or("Can't get home_dir")?;
    install_dir.push(".scaii/bin");

    is_valid_exec_dir(&mut install_dir)?;
    Ok(install_dir)
}

/// Verify we can execute replay from here, we at minimum need to viz directory
/// and the cfg.toml
fn is_valid_exec_dir(dir: &mut PathBuf) -> Result<&mut PathBuf, Box<Error>> {
    let mut viz = dir.clone();
    viz.push("viz");

    let mut protobuf_js = viz.clone();
    protobuf_js.push("js/protobuf_js");

    let mut closure_lib = viz.clone();
    closure_lib.push("js/closure-library");

    let mut cfg_file = dir.clone();
    cfg_file.push("cfg.toml");

    let mut escape = false;
    let mut err_string: String = format!("Bad directory \"{}\", cannot find ", dir.display());
    if !viz.is_dir() {
        escape = true;
        err_string += "viz directory";
    }

    if !cfg_file.is_file() {
        if escape {
            err_string += " or ";
        }
        escape = true;
        err_string += "configuration file (cfg.toml)";
    }

    if escape {
        return Err(Box::new(ScaiiError::new(&err_string)));
    }

    err_string.clear();
    err_string += &format!("\"{}\" appears to be a valid directory but ", dir.display());

    let mut both_missing = false;

    if !protobuf_js.is_dir() {
        escape = true;
        err_string += "protobuf_js";
    }

    if !closure_lib.is_dir() {
        if escape {
            err_string += " and ";
            both_missing = true;
        }

        err_string += "closure_library"
    }

    if both_missing {
        err_string += " are ";
    } else if escape {
        err_string += " is ";
    }

    if escape {
        err_string += "missing, are you sure you installed properly?";
        Err(Box::new(ScaiiError::new(&err_string)))
    } else {
        Ok(dir)
    }
}
