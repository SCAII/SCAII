$ExecDir = ".."
if ( Get-Location -Path -ne $PSScriptRoot) {
    $ExecDir = Get-Location -Path
    Set-Location $PSScriptRoot
}

Invoke-Expression .\gen_protos.ps1

Set-Location js
Write-Output "Cloning google closure library dependency"
git clone https://github.com/google/closure-library
Write-Output "Cloning and setting up protobuf-js dependency"
git clone https://github.com/google/protobuf
Move-Item protobuf/js ./protobuf_js
Write-Output "Cleaning up"
Remove-Item -R -Force protobuf
Set-Location $ExecDir
Write-Output "... done!"