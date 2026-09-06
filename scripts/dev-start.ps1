$root = "c:\Users\Lenovo\Desktop\jabaridental"
Set-Location $root
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","set CI=true&& node node_modules\wrangler\bin\wrangler.js dev --port 8787 < NUL > wrangler-dev.log 2>&1" -WorkingDirectory $root -WindowStyle Hidden
Write-Output "launched"
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
