
use super::Settings;

#[test]
fn default_settings() {
    use toml;
    use std::default::Default;

    let empty_toml = "";
    let settings: Settings = toml::from_str(empty_toml).expect("Could not parse empty string");

    assert_eq!(settings.ip, Settings::default().ip);
    assert_eq!(settings.port, Settings::default().port);
}

#[test]
fn no_ip() {
    use toml;
    use std::default::Default;

    let port_toml = "port=5339";
    let settings: Settings = toml::from_str(port_toml).expect("Could not parse port-only");

    assert_eq!(settings.ip, Settings::default().ip);
    assert_eq!(settings.port, 5339);
}

#[test]
fn no_port() {
    use toml;
    use std::default::Default;
    use std::net::{IpAddr, Ipv4Addr};

    let ip_toml = "ip=\"192.168.1.1\"";
    let settings: Settings = toml::from_str(ip_toml).expect("Could not parse ip-only");

    assert_eq!(settings.ip, IpAddr::V4(Ipv4Addr::new(192, 168, 1, 1)));
    assert_eq!(settings.port, Settings::default().port);
}

#[test]
fn ip_and_port() {
    use toml;
    use std::net::{IpAddr, Ipv4Addr};

    let settings = r#"ip="192.168.1.1"
    port=1234"#;
    let settings: Settings = toml::from_str(settings).expect("Could not parse settings file");

    assert_eq!(settings.ip, IpAddr::V4(Ipv4Addr::new(192, 168, 1, 1)));
    assert_eq!(settings.port, 1234);
}

#[test]
fn rand_init() {
    use toml;

    let settings = "[rand]\nseed=[1,2,3,4]";
    let settings: Settings = toml::from_str(settings).expect("Could not parse rng seed");

    assert_eq!(settings.rand.seed, [1, 2, 3, 4]);
}
