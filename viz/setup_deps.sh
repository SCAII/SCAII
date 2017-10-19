#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"
exec_dir=".."
if [ "$DIR" != "`pwd`" ]
then
    exec_dir=`pwd`
    cd $DIR
fi

cd js
echo "Cloning google closure library dependency"
git clone https://github.com/google/closure-library
echo "Cloning and setting up protobuf-js dependency"
git clone https://github.com/google/protobuf
mv protobuf/js ./protobuf_js
echo "Cleaning Up"
rm -rf protobuf
cd "$exec_dir"
echo "... done!"