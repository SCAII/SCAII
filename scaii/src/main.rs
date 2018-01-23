extern crate zip;
extern crate curl;
use std::process;
use std::process::Command;
use std::fmt;
use std::error::Error;
use std::env;
use std::path::PathBuf;
use std::fs;


#[derive(Debug)]
struct InstallError {
    details: String
}

impl InstallError {
    fn new(msg: &str) -> InstallError {
        InstallError{details: msg.to_string()}
    }
}

impl fmt::Display for InstallError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f,"{}",self.details)
    }
}

impl Error for InstallError {
    fn description(&self) -> &str {
        &self.details
    }
}

#[allow(unused_assignments)]
fn main() {
    println!("SCAII installer will now configure the system...");
    let mut scaii_root = get_scaii_root();
    match scaii_root {
        Err(error) => {
            println!("This does not seem to be a valid SCAII installation. {:?}", error.description());
            process::exit(0);
        },
        Ok(_) => ()
    }
    let scaii_root :PathBuf = scaii_root.unwrap();
    //
    //  protoc (Google Protocol Buffers compiler)
    //
    let mut protoc_executable_path = PathBuf::new();
    let protoc_install_result = ensure_protoc_installed();
    match protoc_install_result {
        Ok(path_buf) => {
            protoc_executable_path = path_buf;
        },
        Err(error) => {
            println!("{}",error.description());
            println!("Error - could not ensure protoc was installed.  Try installing from https://github.com/google/protobuf/releases");
            process::exit(0);
        }
    }
    //
    // Running protoc (Google Protocol Buffers compiler)
    //
    let protoc_result = build_javascript_protobufs(&scaii_root, &protoc_executable_path);
    match protoc_result {
        Ok(()) => {},
        Err(error) => {
            println!("{}",error.description());
            println!("Error - could not run protoc to generate javscript protobuf files.");
            process::exit(0);
        }
    }
    let closure_result = ensure_google_closure_lib_installed(&scaii_root);
    match closure_result {
        Ok(()) => {},
        Err(error) => {
            println!("{}",error.description());
            println!("Error - could not install google closure library.");
            process::exit(0);
        }
    }
}

fn ensure_google_closure_lib_installed(scaii_root : &PathBuf) ->  Result<(), Box<Error>> {
    //\SCAII\viz\js\closure-library\closure\bin
    let mut closure_bin_dir = scaii_root.clone();
    closure_bin_dir.push("viz");
    closure_bin_dir.push("js");
    closure_bin_dir.push("closure-library");
    if closure_bin_dir.as_path().exists() {
        println!("closure_dir detected...");
        Ok(())
    }
    else {
        println!("It appears google closure library is not installed - will try to install it.");
        let mut closure_install_dir = scaii_root.clone();
        closure_install_dir.push("viz");
        closure_install_dir.push("js");
        
        //
        //  WIERD - I was trying to download version v20170910 that I have been using all along 
        // (and thus testing against).  It turns out the version number in the package.json file are
        // a release behind, so I had to download v20171112.zip to get this desired version:
        // "version": "20170910.0.0",
        //
        //let filename = String::from("v20170910.zip");
        //let url = String::from("https://github.com/google/closure-library/archive/v20170910.zip");
        let filename = String::from("v20171112.zip");
        let url = String::from("https://github.com/google/closure-library/archive/v20171112.zip");
        let install_result = install_google_closure_library(closure_install_dir, url, filename, String::from("closure-library-20171112"));
        match install_result {
            Ok(_) => Ok(()),
            Err(error) =>Err(Box::new(InstallError::new(&format!("google closure library download appears to have failed: {:?}", error.description() ))))
        }
    }
}

fn install_google_closure_library(mut closure_install_dir : PathBuf, url : String, filename : String, orig_unzipped_dir_name: String) -> Result<PathBuf, Box<Error>> {
    env::set_current_dir(&closure_install_dir)?;
    let mut closure_zip_path: PathBuf = closure_install_dir.clone();
    closure_zip_path.push(filename);
    let curl_result = download_using_curl(&url, &closure_zip_path);
    match curl_result {
        Ok(_) => {
            // verify expected file exists
            if !closure_zip_path.as_path().exists() {
                println!("ERROR - google closure library install failed.");
                Err(Box::new(InstallError::new(&format!("google closure library download appears to have failed - file not present {:?}", closure_zip_path ))))
            }
            else {
                println!("downloaded closure zip...");
                let f = fs::File::open(closure_zip_path)?;
                unzip_file(&closure_install_dir,f)?;
                let mut closure_temp_dir_name = closure_install_dir.clone();
                closure_temp_dir_name.push(&orig_unzipped_dir_name);
                
                closure_install_dir.push("closure-library");
                let rename_result = fs::rename(&orig_unzipped_dir_name, &closure_install_dir);
                match rename_result {
                    Ok(_) => {
                        if closure_install_dir.exists() {
                            Ok(closure_install_dir)
                        }
                        else {
                            Err(Box::new(InstallError::new(&format!("{:?} does not exist after unzipping closure bundle.",closure_install_dir))))
                        }
                    },
                    Err(error) => {
                        println!("{}", error.description());
                        Err(Box::new(InstallError::new(&format!("could not rename {:?} to {:?}.",closure_temp_dir_name,closure_install_dir))))
                    }
                }
                
                
            }
        }
        Err(error) => {
            Err(Box::new(InstallError::new(&format!("tried using curl library to download protoc from {} , but hit error: {}", url, error.description() ))))
        }
    }
}

fn build_javascript_protobufs(scaii_root: &PathBuf, protoc_executable_path: &PathBuf) -> Result<(), Box<Error>> {
    // change directory to <scaii_root>/viz/js
    let mut path_buf = scaii_root.clone();
    path_buf.push("viz");
    path_buf.push("js");
    env::set_current_dir(&path_buf)?;
    println!("Current dir is {:?}",env::current_dir());
    //protoc --proto_path="./../../common_protos" --js_out=library=vizProto,binary:. ./../../common_protos/*.proto
    let command = format!("{}", protoc_executable_path.to_str().unwrap());
    println!("COMMAND WAS {:?}", command);
    let mut args : Vec<String> = Vec::new();

    args.push(String::from("--proto_path=./../../common_protos"));
    args.push(String::from("--js_out=library=vizProto,binary:."));
    //args.push(String::from("./../../common_protos/*.proto"));
    args.push(String::from("./../../common_protos/*.proto"));
    //args.push(String::from("./../../common_protos"));
    let protoc_invocation_result = run_command(&command, args)?;
    if protoc_invocation_result == "" {
        Ok(())
    } 
    else {
        Err(Box::new(InstallError::new(&format!("Error running protoc to generate javascript protobuf: {:?}", protoc_invocation_result))))
    }
}

fn get_protoc_download_filename() -> String {
    if cfg!(target_os = "windows") {
        String::from("protoc-3.4.0-win32.zip")
        //String::from("protoc-3.5.1-win32.zip")
    } 
    else if cfg!(target_os = "unix") {
        String::from("protoc-3.4.0-linux-x86_64.zip")
    }
    else {
        // assume mac
        String::from("protoc-3.4.0-osx-x86_64.zip")
    }
}

#[allow(unused_assignments)]
fn ensure_dot_scaii_dir_exists() -> Result<PathBuf, Box<Error>> {
    let home_dir : Option<PathBuf> =  env::home_dir();
    let mut p_buf = PathBuf::new();
    match home_dir {
        None => {
            // put .scaii undeneath SCAII_ROOT instead since homeDir could not be determined
            let mut scaii_root_pathbuf = get_scaii_root()?;
            scaii_root_pathbuf.push(".scaii");
            p_buf = scaii_root_pathbuf;
        }
        Some(dir) => {
            p_buf = dir;
            p_buf.push(".scaii");
        }
    }
    if p_buf.exists() {
        println!(".scaii directory found here: {:?}", p_buf.clone());
        Ok(p_buf)
    }
    else {
        println!("Creating .scaii directory here: {:?}", p_buf.clone());
        let create_dir_result = fs::create_dir(p_buf.clone());
        match create_dir_result {
            Err(error) => {
                Err(Box::new(InstallError::new(&format!("Could not create .scaii directory for installing dependencies.  {}", error.description() ))))
            }
            Ok(()) =>
                Ok(p_buf)
        }
    }
}

fn download_using_curl(url : &String, target_path: &PathBuf) ->  Result<(), Box<Error>> {
    use curl::easy::{Easy2, Handler, WriteError};
    use std::io::Write;
    struct Collector(Vec<u8>);

    impl Handler for Collector {
        fn write(&mut self, data: &[u8]) -> Result<usize, WriteError> {
            self.0.extend_from_slice(data);
            Ok(data.len())
        }
    }
    
    let mut easy = Easy2::new(Collector(Vec::new()));
    easy.get(true).unwrap();
    easy.follow_location(true).unwrap();
    easy.url(url).unwrap();
    easy.perform().unwrap();

    assert_eq!(easy.response_code().unwrap(), 200);
    let contents = easy.get_ref();
    let mut output_file = fs::File::create(target_path)?;
    output_file.write_all(&contents.0)?;
    Ok(())
}

fn install_protoc(mut dot_scaii_dir : PathBuf, url : String, filename : String) -> Result<PathBuf, Box<Error>> {
    dot_scaii_dir.push("protoc");
    let mut protoc_dir = dot_scaii_dir; // for clarity
    ensure_dir_exists(&protoc_dir)?;
    env::set_current_dir(&protoc_dir)?;
    let mut protoc_zip_path: PathBuf = protoc_dir.clone();
    protoc_zip_path.push(filename);
    let curl_result = download_using_curl(&url, &protoc_zip_path);
    match curl_result {
        Ok(_) => {
            // verify expected file exists
            if !protoc_zip_path.as_path().exists() {
                println!("ERROR - protoc install failed.");
                Err(Box::new(InstallError::new(&format!("protoc download appears to have failed - file not present {:?}", protoc_zip_path ))))
            }
            else {
                println!("downloaded protoc zip...");
                let f = fs::File::open(protoc_zip_path)?;
                unzip_file(&protoc_dir,f)?;
                protoc_dir.push("bin");
                protoc_dir.push("protoc.exe");
                if protoc_dir.exists() {
                    Ok(protoc_dir)
                }
                else {
                    Err(Box::new(InstallError::new(&format!("{:?} does not exist after unzipping protoc bundle.",protoc_dir))))
                }
                
            }
        }
        Err(error) => {
            Err(Box::new(InstallError::new(&format!("tried using curl library to download protoc from {} , but hit error: {}", url, error.description() ))))
        }
    }
}

fn unzip_file(parent : &PathBuf, zip_file : fs::File) -> Result<(), Box<Error>> {
    use std::io::Read;
    use std::io::Write;
    let mut zip = try!(zip::ZipArchive::new(&zip_file));
    println!("unzipping {:?}... zip file count is {}", zip_file,zip.len());
    for i in 0..zip.len()
    {
        let mut zip_file = zip.by_index(i).unwrap();
        let file_size = zip_file.size();
        match file_size {
            0 => {
                ensure_subdir_exists(parent.clone(), zip_file.name())?;
            },
            _ => {
                let path = append_relative_path(parent.clone(), zip_file.name());
                let mut buf : Vec<u8> = Vec::new();
                let _read_result_usize = zip_file.read_to_end(&mut buf)?;
                let mut output_file = fs::File::create(path)?;
                output_file.write_all(buf.as_slice())?;
            }
        }
    }
    Ok(())
}

fn ensure_protoc_installed() -> Result<PathBuf, Box<Error>> {
    // always install it into .scaii dir
    println!("Installing protoc compiler...");
    let scaii_dir_result = ensure_dot_scaii_dir_exists();
    match scaii_dir_result {
        Ok(scaii_dir_pbuf) => {
            let filename = get_protoc_download_filename();
            let url = format!("https://github.com/google/protobuf/releases/download/v3.4.0/{}", &filename);
            install_protoc(scaii_dir_pbuf, url, filename)
        },
        Err(error) => {
            Err(Box::new(InstallError::new(&format!("Problem creating .scaii dir for installing dependencies: {}", error.description()))))
        }
    }
}

fn run_command_windows(command: &String, args: Vec<String>) -> Result<String, Box<Error>> {
    let mut c = Command::new("cmd");
    let c = c.arg("/C");
    let c = c.arg(command);
    for arg in args.iter() {
        c.arg(arg);
    }
    println!("...running command {:?}", c);
    let output = c.output().expect(&String::as_str(
        &format!("failed to launch command {}", command),
    ));
    if output.status.success() {
        let result = String::from_utf8(output.stdout);
        match result{
            Ok(output_string) => Ok(output_string),
            Err(_utf8_convert_error) => Err(Box::new(InstallError::new("problem converting command result from utf8"))),
        }
    }
    else {
        Err(Box::new(InstallError::new(&String::from_utf8_lossy(&output.stderr))))
    }
}

fn run_command_unix(command: &String, args: Vec<String>) -> Result<String, Box<Error>> {
    let mut c = Command::new("sh");
    let c = c.arg("-c");
    let c = c.arg(command);
    for arg in args.iter() {
        c.arg(arg);
    }
    println!("...running command {:?}", c);
    let output = c.output().expect(&String::as_str(
        &format!("failed to launch command {}", command),
    ));
    if output.status.success() {
        let result = String::from_utf8(output.stdout);
        match result{
            Ok(output_string) => Ok(output_string),
            Err(_utf8_convert_error) => Err(Box::new(InstallError::new("problem converting command result from utf8"))),
        }
    }
    else {
        Err(Box::new(InstallError::new(&String::from_utf8_lossy(&output.stderr))))
    }
}

fn run_command_mac(command: &String, _args: Vec<String>) -> Result<String, Box<Error>> {
    let mut c = Command::new("sh");
    let c = c.arg("-c");
    // for mac, command plus the args come across in the command value - if we split it
    // up like we do on windows in command and arg, it doesn't work foe some reasoin ("open file:///...") 
    let c = c.arg(command);
    println!("...running command {:?}", c);
    let output = c.output().expect(&String::as_str(
        &format!("failed to launch command {}", command),
    ));
    if output.status.success() {
        let result = String::from_utf8(output.stdout);
        match result{
            Ok(output_string) => Ok(output_string),
            Err(_utf8_convert_error) => Err(Box::new(InstallError::new("problem converting command result from utf8"))),
        }
    }
    else {
        Err(Box::new(InstallError::new(&String::from_utf8_lossy(&output.stderr))))
    }
}

fn run_command(command: &String, args: Vec<String>) -> Result<String, Box<Error>> {
    let hard_coded_protoc_command = String::from("protoc");
    let mut final_command: &String = &command.clone();
    if command == "\"protoc\"" { // has extra quotes that I can't figure out how to prevent (from PathBug)
        final_command = &hard_coded_protoc_command;
    }
    if cfg!(target_os = "windows") {
        run_command_windows(final_command, args)
    } 
    else if cfg!(target_os = "unix") {
        run_command_unix(final_command, args)
    }
    else {
        // assume mac
        run_command_mac(final_command, args)
    }
}

fn get_scaii_root() -> Result<PathBuf, Box<Error>> {
    //look at current dir, see if peer directories are as expected, if so use parent.
    let mut parent_dir: PathBuf = env::current_dir()?;
    // find parent
    parent_dir.pop();

    let mut core_dir = parent_dir.clone();
    core_dir.push("core");
    if !core_dir.exists() {
        return Err(Box::new(InstallError::new("core directory could not be found, coult not verify SCAII_ROOT")));
    }
    let mut common_protos_dir = parent_dir.clone();
    common_protos_dir.push("common_protos");
    if !common_protos_dir.exists() {
        return Err(Box::new(InstallError::new("common_protos directory could not be found, coult not verify SCAII_ROOT")));
    }
    Ok(parent_dir)
}

fn ensure_dir_exists(path_buf: &PathBuf) -> Result<(), Box<Error>> {
    if !path_buf.as_path().exists() {
        fs::create_dir_all(path_buf.as_path())?;
    }
    Ok(())
}

fn ensure_subdir_exists(mut path_buf: PathBuf, subdir : &str) -> Result<(), Box<Error>> {
    let parts_iter = subdir.split("/");
    for part in parts_iter {
        match part {
            "" => {
                // do nothing
            },
            ref x => {
                path_buf.push(x);
                ensure_dir_exists(&path_buf)?;
            }
        }
    }
    Ok(())
}

fn append_relative_path(mut path_buf: PathBuf, subdir : &str)-> PathBuf {
    let parts_iter = subdir.split("/");
    for part in parts_iter {
        match part {
            "" => {
                // do nothing
            },
            ref x => {
                path_buf.push(x);
            }
        }
    }
    path_buf
}