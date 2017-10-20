#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)/js"
cd DIR

printf "Building protobuf file\n"
protoc --proto_path="$DIR/../../common_protos" --js_out=library=vizProto,binary:"." "$DIR/../../common_protos/*.proto"