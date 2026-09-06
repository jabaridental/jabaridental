# Rebuild + restart local wrangler dev cleanly.
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# 1. Kill anything bound to the dev port (the workerd holding the console).
$pids = Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $pids) {
  Write-Output "killing port 8787 owner $p"
  & taskkill /PID $p /T /F 2>&1 | Out-String
}

# 2. Kill any leftover build powershell invocations.
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*build-with-env*' -or $_.CommandLine -like '*local-e2e-setup*' } | ForEach-Object {
  Write-Output "killing stale powershell $($_.ProcessId)"
  & taskkill /PID $_.ProcessId /T /F 2>&1 | Out-String
}

Start-Sleep -Seconds 2

# 3. Rebuild (loads .env so the Cloudflare build secret guard passes).
Write-Output "=== BUILD ==="
& powershell -NoProfile -ExecutionPolicy Bypass -File "$root\scripts\build-with-env.ps1" 2>&1 | Out-String

# 4. Restart wrangler dev in the background.
Write-Output "=== START DEV ==="
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","set CI=true&& node node_modules\wrangler\bin\wrangler.js dev --port 8787 < NUL > wrangler-dev.log 2>&1" -WorkingDirectory $root -WindowStyle Hidden

# 5. Wait for health.
$ok = $false
for ($i = 0; $i -lt 45; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:8787/api/health" -UseBasicParsing -TimeoutSec 3
    Write-Output "HEALTH: $($r.StatusCode) $($r.Content)"
    $ok = $true
    break
  } catch { Write-Output "waiting... ($i)" }
}
if (-not $ok) { Write-Output "HEALTH CHECK FAILED" }
Write-Output "=== DONE ==="