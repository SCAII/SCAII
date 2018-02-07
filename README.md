# SCAII
The main SCAII repository containing the basic architecture for supported languages, installers, definitions, and so on.


# Build Steps for MacOSX


````
cd ./core

cargo build --release

mkdir -p ~/.scaii/bin

mkdir -p ~/.scaii/glue/python

cp ../target/release/libscaii_core.dylib

~/.scaii/bin/scaii_core.dylib

cp -r ../glue/python ~/.scaii/glue/python


````

Add `~/.scaii/glue/python` to your `PYTHONPATH`

Add `~/.scaii/bin` to your `PATH`
