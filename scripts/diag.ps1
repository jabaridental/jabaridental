$root = "c:\Users\Lenovo\Desktop\jabaridental"
Write-Output "--- node/workerd/npx processes ---"
Get-Process | Where-Object { $_.Name -match "node|workerd|wrangler" } | Select-Object Id, Name, StartTime | Format-Table -AutoSize | Out-String
Write-Output "--- wrangler state ---"
if (Test-Path "$root\.wrangler\state\v3\d1") {
  Get-ChildItem "$root\.wrangler\state\v3\d1" -Recurse -File | Select-Object FullName, Length | Format-Table -AutoSize | Out-String
} else { Write-Output "no .wrangler state yet" }
Write-Output "--- local-d1.txt ---"
Get-Content "$root\local-d1.txt" -ErrorAction SilentlyContinue | Out-String
Write-Output "--- wrangler-dev.log ---"
Get-Content "$root\wrangler-dev.log" -ErrorAction SilentlyContinue | Out-String
Write-Output "--- wrangler-dev.err.log ---"
Get-Content "$root\wrangler-dev.err.log" -ErrorAction SilentlyContinue | Out-String
