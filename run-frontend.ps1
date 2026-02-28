# Run SentinelRx-AI Frontend
# Usage: .\run-frontend.ps1

$ErrorActionPreference = "Stop"
$frontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "Starting SentinelRx-AI Frontend..." -ForegroundColor Cyan
Write-Host ""

Set-Location $frontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Frontend will run at http://localhost:5173" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npm run dev
