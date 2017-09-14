extern crate protoc_rust;
extern crate glob;

fn main() {
    use glob::glob;

    protoc_rust::run(protoc_rust::Args {
        out_dir: "src/internal/protos",
        input: &["../common_protos/universal_messages.proto"],
        includes: &["../common_protos"],
    }).expect("Protoc Error");

    // Make our protobuf file a reason to recompile
    // (See http://doc.crates.io/build-script.html for more info 
    // on outputs)
    println!("cargo:rerun-if-changed=../common_protos/universal_messages.proto");
    
    // Unfortunately, rerun-if-changed overrides Cargo's default handling, which
    // is to rerun if any of our files change, so we have to re-add all our source
    // files
    println!("cargo:rerun-if-changed=Cargo.toml");

    for entry in glob("src/*.rs").expect("Could not parse glob pattern") {
        if let Ok(path) = entry {
            println!("cargo:rerun-if-changed={}",path.display())
        }
    }
}