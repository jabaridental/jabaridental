# Attach media.jabaridental.com as the R2 bucket custom domain (production fix).
$root = "c:\Users\Lenovo\Desktop\jabaridental"
$envVars = @{}
Get-Content "$root\.env" | ForEach-Object {
  if ($_ -match '^([A-Za-z_]+)=(.*)$') { $envVars[$matches[1]] = $matches[2].Trim() }
}
$token = $envVars['CLOUDFLARE_API_TOKEN']
$acct  = $envVars['CLOUDFLARE_ACCOUNT_ID']
$zone  = "84daa0e0e4a92b95affa53a77e9f97fa"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

function CallApi($name, $method, $url, $body = $null) {
  Write-Output "=== $name ==="
  try {
    $args = @{ Uri = $url; Method = $method; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 60 }
    if ($body) { $args.Body = ($body | ConvertTo-Json -Depth 6 -Compress) }
    $resp = Invoke-WebRequest @args
    Write-Output "HTTP $($resp.StatusCode)"
    Write-Output $resp.Content
  } catch {
    Write-Output "HTTP $([int]$_.Exception.Response.StatusCode): $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Output $_.ErrorDetails.Message }
  }
  Write-Output ""
}

CallApi "ATTACH CUSTOM DOMAIN media.jabaridental.com" "POST" "https://api.cloudflare.com/client/v4/accounts/$acct/r2/buckets/jabari-dental-media/domains/custom" @{ domain = "media.jabaridental.com"; zoneId = $zone; enabled = $true }
CallApi "LIST CUSTOM DOMAINS" "GET" "https://api.cloudflare.com/client/v4/accounts/$acct/r2/buckets/jabari-dental-media/custom_domains"
CallApi "DNS RECORDS (media.*)" "GET" "https://api.cloudflare.com/client/v4/zones/$zone/dns_records?type=CNAME&name=media.jabaridental.com"