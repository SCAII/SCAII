#[cfg(feature="static-rts")]
mod sky_rts {
    extern crate sky_rts;
    use self::sky_rts::Context;

    pub fn load_rts<'a,'b>() -> Context<'a,'b> {
        Context::new()
    }
}

#[cfg(feature="static-rts")]
pub use self::sky_rts::load_rts;

#[cfg(not(feature="static-rts"))]
pub fn load_rts() -> ! {
    panic!("RTS is not enabled statically")
}