# SprintSim - Start local Supabase + patch .env.local
# Run from the sprintsim folder: .\start-local.ps1

Write-Host ""
Write-Host "Starting Supabase in Docker..." -ForegroundColor Cyan
Write-Host ""

$rawLines = @()
npx supabase@latest start 2>&1 | ForEach-Object {
  Write-Host $_
  $rawLines += [string]$_
}
$rawText = $rawLines -join [System.Environment]::NewLine

# Try new v2 key names first, fall back to legacy names
$apiUrl = [regex]::Match($rawText, 'Project URL\s+\S*\s+(https?://[\d.:]+)').Groups[1].Value.Trim()
if (-not $apiUrl) {
  $apiUrl = [regex]::Match($rawText, 'API URL:\s+(https?://\S+)').Groups[1].Value.Trim()
}

$anonKey = [regex]::Match($rawText, 'Publishable\s+\S*\s+(sb_publishable_\S+)').Groups[1].Value.Trim()
if (-not $anonKey) {
  $anonKey = [regex]::Match($rawText, 'anon key:\s+(\S+)').Groups[1].Value.Trim()
}

$serviceKey = [regex]::Match($rawText, 'Secret\s+\S*\s+(sb_secret_\S+)').Groups[1].Value.Trim()
if (-not $serviceKey) {
  $serviceKey = [regex]::Match($rawText, 'service_role key:\s+(\S+)').Groups[1].Value.Trim()
}

if (-not $apiUrl) {
  Write-Host "Supabase already running. Fetching status..." -ForegroundColor Yellow
  $rawLines = @()
  npx supabase@latest status 2>&1 | ForEach-Object { $rawLines += [string]$_ }
  $rawText = $rawLines -join [System.Environment]::NewLine

  $apiUrl = [regex]::Match($rawText, 'Project URL\s+\S*\s+(https?://[\d.:]+)').Groups[1].Value.Trim()
  if (-not $apiUrl) {
    $apiUrl = [regex]::Match($rawText, 'API URL:\s+(https?://\S+)').Groups[1].Value.Trim()
  }
  $anonKey = [regex]::Match($rawText, 'Publishable\s+\S*\s+(sb_publishable_\S+)').Groups[1].Value.Trim()
  if (-not $anonKey) {
    $anonKey = [regex]::Match($rawText, 'anon key:\s+(\S+)').Groups[1].Value.Trim()
  }
  $serviceKey = [regex]::Match($rawText, 'Secret\s+\S*\s+(sb_secret_\S+)').Groups[1].Value.Trim()
  if (-not $serviceKey) {
    $serviceKey = [regex]::Match($rawText, 'service_role key:\s+(\S+)').Groups[1].Value.Trim()
  }
}

if (-not $apiUrl -or -not $anonKey) {
  Write-Host ""
  Write-Host "Could not auto-parse credentials." -ForegroundColor Yellow
  Write-Host "Please manually copy these values from the output above into .env.local:" -ForegroundColor Yellow
  Write-Host "  NEXT_PUBLIC_SUPABASE_URL      = (Project URL value)"
  Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY = (Publishable value)"
  Write-Host "  SUPABASE_SERVICE_ROLE_KEY     = (Secret value)"
  exit 0
}

$envPath = ".env.local"
$lines = if (Test-Path $envPath) { Get-Content $envPath } else { @() }

function Set-EnvVar($lines, $key, $value) {
  $found = $false
  $result = $lines | ForEach-Object {
    if ($_ -match "^$key=") { $found = $true; "$key=$value" }
    else { $_ }
  }
  if (-not $found) { $result += "$key=$value" }
  return $result
}

$lines = Set-EnvVar $lines "NEXT_PUBLIC_SUPABASE_URL"      $apiUrl
$lines = Set-EnvVar $lines "NEXT_PUBLIC_SUPABASE_ANON_KEY" $anonKey
$lines = Set-EnvVar $lines "SUPABASE_SERVICE_ROLE_KEY"     $serviceKey

Set-Content $envPath $lines -Encoding UTF8

Write-Host ""
Write-Host "Updated .env.local" -ForegroundColor Green
Write-Host "  URL = $apiUrl"
Write-Host "  Key = $($anonKey.Substring(0, [Math]::Min(30, $anonKey.Length)))..."
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. npm run dev"
Write-Host "  2. Sign up at http://localhost:3000/login as naomihbeltrand@gmail.com"
Write-Host "  3. .\seed-db.ps1"
Write-Host ""
Write-Host "Supabase Studio: http://localhost:54323" -ForegroundColor Gray
