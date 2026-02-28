# Run SentinelRx-AI Backend
# Usage: .\run-backend.ps1

$ErrorActionPreference = "Stop"
$backendDir = Join-Path $PSScriptRoot "backend"

Write-Host "Starting SentinelRx-AI Backend..." -ForegroundColor Cyan
Write-Host ""

Set-Location $backendDir

# Activate venv
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "Virtual environment not found. Run: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

# DATABASE_URL is read from backend/.env - do not override it here

Write-Host "Backend will run at http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

uvicorn app.main:app --reload
