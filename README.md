The flagship configurable RTS engine for SCAII.

Installation Instructions
===========

Go to `backend` and run `cargo build --release`

```
cp backend/target/release/(lib)backend.[dll/dylib/so] to ~/.scaii/backends/bin/[lib]sky-rts.[so/dylib/dll]

cp backend/lua/* to ~/.scaii/backends/sky-rts/maps

mkdir -p ~/.scaii/glue/python/scaii/env/sky-rts
cp -r game_wrapper/python/* to ~/.scaii/glue/python/scaii/env/sky-rts
```