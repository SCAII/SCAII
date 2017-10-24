$ExecDir = ..
if ( Get-Location -Path -ne $PSScriptRoot) {
    $ExecDir = Get-Location -Path
    Set-Location $PSScriptRoot
}

Set-Location js
Write-Output "Building protobuf file"
# WARNING, if your editor is set to autoformat on save, saving this file will BREAK this line by adding a space
# in "vizProto,binary". Make sure you override that setting for this directory
protoc --proto_path="../../common_protos" --js_out=library=vizProto,binary:"." "../../common_protos/*.proto"
Set-Location $ExecDir