pub fn max<O: PartialOrd+Copy>(x1: O, x2: O) -> O {
    if x1 > x2 {
        x1
    } else {
        x2
    }
}