# Inspect production D1: table row counts + where media URLs live.
$root = "c:\Users\Lenovo\Desktop\jabaridental"
$envVars = @{}
Get-Content "$root\.env" | ForEach-Object {
  if ($_ -match '^([A-Za-z_]+)=(.*)$') { $envVars[$matches[1]] = $matches[2].Trim() }
}
$token = $envVars['CLOUDFLARE_API_TOKEN']
$acct  = $envVars['CLOUDFLARE_ACCOUNT_ID']
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

function D1Query($name, $sql) {
  Write-Output "=== $name ==="
  try {
    $body = @{ sql = $sql } | ConvertTo-Json -Depth 4 -Compress
    $resp = Invoke-WebRequest -Uri "https://api.cloudflare.com/client/v4/accounts/$acct/d1/database/56b86e4d-14ad-432e-b427-d67cc3b786f2/query" -Method POST -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 60
    Write-Output "HTTP $($resp.StatusCode)"
    Write-Output $resp.Content
  } catch {
    Write-Output "HTTP $([int]$_.Exception.Response.StatusCode): $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Output $_.ErrorDetails.Message }
  }
  Write-Output ""
}

D1Query "row counts per table" "SELECT 'treatments' t, count(*) n FROM treatments UNION ALL SELECT 'articles', count(*) FROM articles UNION ALL SELECT 'gallery', count(*) FROM gallery UNION ALL SELECT 'team', count(*) FROM team UNION ALL SELECT 'before_after', count(*) FROM before_after UNION ALL SELECT 'media', count(*) FROM media UNION ALL SELECT 'hours', count(*) FROM hours"
D1Query "treatments image URLs" "SELECT id, name, substr(image,1,160) img FROM treatments LIMIT 8"
D1Query "media rows" "SELECT id, substr(url,1,140) url FROM media LIMIT 8"