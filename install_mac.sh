echo "Git pull.."
git pull

cd backend

echo "Cargo build..."
cargo build --release

cd ..

mkdir -p  ~/.scaii/backends/bin

echo "Copy dylib..."
cp ./backend/target/release/libbackend.dylib  ~/.scaii/backends/bin/sky-rts.dylib

echo "Creating dirs..."
mkdir -p ~/.scaii/backends/sky-rts/maps

echo "Copy backend..."
cp ./backend/lua/* ~/.scaii/backends/sky-rts/maps

mkdir -p ~/.scaii/glue/python/scaii/env/sky_rts

echo "Copying game wrapper..."
cp -r ./game_wrapper/python/*  ~/.scaii/glue/python/scaii/env/sky_rts
