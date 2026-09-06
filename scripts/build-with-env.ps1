# Loads .env into process env, then runs the Cloudflare build.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location -Path $root
Get-Content (Join-Path $root ".env") | ForEach-Object {
  if ($_ -match '^([A-Za-z_]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim(), "Process")
  }
}
& npm.cmd run build
exit $LASTEXITCODE
