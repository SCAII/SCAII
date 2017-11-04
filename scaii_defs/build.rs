extern crate glob;
extern crate prost_build;

fn main() {
    use glob::glob;

    prost_build::compile_protos(&["../common_protos/scaii.proto"], &["../common_protos"]).unwrap();

    // Make our protobuf file a reason to recompile
    // (See http://doc.crates.io/build-script.html for more info
    // on outputs)
    for entry in glob("../common_protos/*.rs") {
        println!("cargo:rerun-if-changed={}", path.display());
    }

    // Unfortunately, rerun-if-changed overrides Cargo's default handling, which
    // is to rerun if any of our files change, so we have to re-add all our source
    // files
    println!("cargo:rerun-if-changed=Cargo.toml");

    for entry in glob("src/*.rs").expect("Could not parse glob pattern") {
        if let Ok(path) = entry {
            println!("cargo:rerun-if-changed={}", path.display())
        }
    }
}
