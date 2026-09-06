# Probe production account (3f741aa1...) — workers, D1, zone routes, DNS.
$root = "c:\Users\Lenovo\Desktop\jabaridental"
$envVars = @{}
Get-Content "$root\.env" | ForEach-Object {
  if ($_ -match '^([A-Za-z_]+)=(.*)$') { $envVars[$matches[1]] = $matches[2].Trim() }
}
$token = $envVars['CLOUDFLARE_API_TOKEN']
$acct  = $envVars['CLOUDFLARE_ACCOUNT_ID']
$zone  = "84daa0e0e4a92b95affa53a77e9f97fa"
$headers = @{ Authorization = "Bearer $token" }

function Probe($name, $url) {
  Write-Output "=== $name ==="
  try {
    $resp = Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing -TimeoutSec 30
    Write-Output "HTTP $($resp.StatusCode)"
    Write-Output $resp.Content
  } catch {
    Write-Output "HTTP $([int]$_.Exception.Response.StatusCode): $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Output $_.ErrorDetails.Message }
  }
  Write-Output ""
}

Probe "ACCOUNT 3f741a WORKERS" "https://api.cloudflare.com/client/v4/accounts/$acct/workers/scripts"
Probe "ACCOUNT 3f741a D1 DATABASES" "https://api.cloudflare.com/client/v4/accounts/$acct/d1/database"
Probe "ZONE WORKERS ROUTES" "https://api.cloudflare.com/client/v4/zones/$zone/workers/routes"
Probe "ZONE DNS RECORDS" "https://api.cloudflare.com/client/v4/zones/$zone/dns_records"