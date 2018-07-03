const VALID: &'static str = include_str!("ex.qna");

#[test]
fn parse() {
    use super::Qna;

    let qna = Qna::try_from_str(VALID);
    match qna {
        Ok(_) => {}
        Err(e) => panic!("{}", e),
    }
}
