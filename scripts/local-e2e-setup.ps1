# Local E2E setup: migrate local D1, seed it, start wrangler dev in background.
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location -Path $root
$env:CI = "true"
$wr = Join-Path $root "node_modules\wrangler\bin\wrangler.js"

Write-Output "=== 0. wrangler entry exists? ==="
Write-Output (Test-Path $wr)

Write-Output "=== 1. Local D1 migrations ==="
& node $wr d1 migrations apply DB --local 2>&1 | Out-String

Write-Output "=== 2. Seed local D1 ==="
& node scripts/seed-d1.mjs --local 2>&1 | Out-String

Write-Output "=== 3. Start wrangler dev (background, port 8787) ==="
$dev = Start-Process -FilePath "node" -ArgumentList "`"$wr`"","dev","--port","8787" -WorkingDirectory $root -RedirectStandardOutput "$root\wrangler-dev.log" -RedirectStandardError "$root\wrangler-dev.err.log" -PassThru -WindowStyle Hidden
Write-Output "wrangler dev PID: $($dev.Id)"

Write-Output "=== 4. Wait for health ==="
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:8787/api/health" -UseBasicParsing -TimeoutSec 3
    Write-Output "HEALTH: $($r.StatusCode) $($r.Content)"
    $ok = $true
    break
  } catch { Write-Output "waiting... ($i)" }
}
if (-not $ok) { Write-Output "HEALTH CHECK FAILED" }
Write-Output "=== done ==="
