use super::*;
use FUZZY_EQ_THRESH;

#[test]
fn test_to_from_proto() {
    use rand;
    let entity = IdEntity::rand_new(0, &mut rand::thread_rng());

    let proto = entity.to_proto();

    match IdEntity::from_proto(&proto) {
        Err(err) => {
            panic!(
                "Could not decode proto just created: {}. Proto: {:?}",
                err,
                proto
            )
        }
        Ok(got) => assert!(entity.fuzzy_eq(&got, FUZZY_EQ_THRESH)),
    }
}
