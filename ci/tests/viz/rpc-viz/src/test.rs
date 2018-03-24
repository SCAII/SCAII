use super::Settings;

// Number of iterations used to verify random things are/aren't
// diverging
const RAND_VERIFY_ITERS: usize = 100;

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

// This exists to verify the seeded rand is working properly.
// On its face this seems obviously true, but hash maps
// and such can screw this up.
#[test]
fn seeded_rand_is_consistent() {
    use rand::{SeedableRng, XorShiftRng};
    use entity::IdEntity;

    use std::collections::HashMap;

    let seed = [1, 2, 3, 4];
    let mut rng = XorShiftRng::from_seed(seed.clone());

    let master = super::gen_entities(&mut rng);

    for _ in 0..RAND_VERIFY_ITERS {
        let mut rng = XorShiftRng::from_seed(seed);
        let verify = super::gen_entities(&mut rng);

        // These should be EXACTLY bit-equal,
        // if this doesn't diverge. Not just fuzzy equal
        assert_eq!(verify, master);
    }

    // Now, verify updates are consistent
    let entity_map: HashMap<usize, IdEntity> = master
        .into_iter()
        .map(|entity| (entity.id, entity))
        .collect();

    let mut rng = XorShiftRng::from_seed([5, 6, 7, 8]);

    let mut master_map = entity_map.clone();
    let master_packet = super::update_entities(&mut master_map, &mut rng);

    for _ in 0..RAND_VERIFY_ITERS {
        let mut rng = XorShiftRng::from_seed([5, 6, 7, 8]);
        let mut verify_map = entity_map.clone();

        let verify_packet = super::update_entities(&mut verify_map, &mut rng);

        assert_eq!(verify_packet, master_packet);
        assert_eq!(verify_map, master_map);
    }
}
