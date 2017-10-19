#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"
exec_dir=".."
if [ "$DIR" != "`pwd`" ]
then
    exec_dir=`pwd`
    cd $DIR
fi

echo "Building protobuf file"
protoc --proto_path="../../common_protos" --js_out=library=vizProto,binary:"." "../../common_protos/*.proto"

cd "$exec_dir"