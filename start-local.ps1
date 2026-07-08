# SprintSim — Start local Supabase + patch .env.local
# Run this once from the sprintsim folder: .\start-local.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Starting Supabase in Docker..." -ForegroundColor Cyan
Write-Host "(First run pulls images — may take a few minutes)" -ForegroundColor Gray
Write-Host ""

# Start Supabase and capture output
$raw = npx supabase@latest start 2>&1 | ForEach-Object { Write-Host $_; $_ }
$rawText = $raw -join "`n"

# Parse credentials from output
$apiUrl     = [regex]::Match($rawText, 'API URL:\s+(https?://\S+)').Groups[1].Value.Trim()
$anonKey    = [regex]::Match($rawText, 'anon key:\s+(\S+)').Groups[1].Value.Trim()
$serviceKey = [regex]::Match($rawText, 'service_role key:\s+(\S+)').Groups[1].Value.Trim()
$dbUrl      = [regex]::Match($rawText, 'DB URL:\s+(\S+)').Groups[1].Value.Trim()

if (-not $apiUrl) {
  # Already running — use supabase status instead
  Write-Host "Supabase already running. Fetching status..." -ForegroundColor Yellow
  $raw = npx supabase@latest status 2>&1
  $rawText = $raw -join "`n"
  $apiUrl     = [regex]::Match($rawText, 'API URL:\s+(https?://\S+)').Groups[1].Value.Trim()
  $anonKey    = [regex]::Match($rawText, 'anon key:\s+(\S+)').Groups[1].Value.Trim()
  $serviceKey = [regex]::Match($rawText, 'service_role key:\s+(\S+)').Groups[1].Value.Trim()
  $dbUrl      = [regex]::Match($rawText, 'DB URL:\s+(\S+)').Groups[1].Value.Trim()
}

if (-not $apiUrl) {
  Write-Host ""
  Write-Host "Could not read Supabase credentials automatically." -ForegroundColor Red
  Write-Host "Check the output above and copy the values manually into .env.local" -ForegroundColor Red
  exit 1
}

# Read existing .env.local (preserve ANTHROPIC_API_KEY and anything else)
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

Set-Content $envPath $lines

Write-Host ""
Write-Host "Updated .env.local:" -ForegroundColor Green
Write-Host "  NEXT_PUBLIC_SUPABASE_URL      = $apiUrl"
Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY = $($anonKey.Substring(0,20))..."
Write-Host "  SUPABASE_SERVICE_ROLE_KEY     = $($serviceKey.Substring(0,20))..."
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run:  npm run dev"
Write-Host "  2. Go to http://localhost:3000/login and sign up as naomihbeltrand@gmail.com"
Write-Host "  3. Then run: .\seed-db.ps1"
Write-Host ""
Write-Host "Supabase Studio (browse your DB): http://localhost:54323" -ForegroundColor Gray
