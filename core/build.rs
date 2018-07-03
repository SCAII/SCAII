extern crate lalrpop;

fn main() {
    use lalrpop::Configuration;

    Configuration::new()
        .use_cargo_dir_conventions()
        .process()
        .unwrap();
}
