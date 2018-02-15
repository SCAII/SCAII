echo "Git pull..."
git pull

cd ./core

echo "Cargo build..."
cargo build --release

echo "Creating dirs..."
mkdir -p ~/.scaii/bin

mkdir -p ~/.scaii/glue/python

echo "Copying libscaii dylib..."
cp ../target/release/libscaii_core.dylib ~/.scaii/bin/scaii_core.dylib

echo "Copying glue python..."
cp -r ../glue/python/*  ~/.scaii/glue/python
