# SprintSim — Seed the local database
# Run AFTER signing up at localhost:3000/login with naomihbeltrand@gmail.com
# Usage: .\seed-db.ps1

Write-Host ""
Write-Host "Seeding database (creating course, weeks, promoting instructor)..." -ForegroundColor Cyan

npx supabase@latest db execute --file .\supabase\seed.sql

Write-Host ""
Write-Host "Done! Go to http://localhost:3000/login and sign in." -ForegroundColor Green
Write-Host "You'll land on the instructor dashboard." -ForegroundColor Green
