@echo off
echo Starting SentinelRx AI - Backend and Frontend
echo.
echo 1. Starting Backend on http://localhost:8000 ...
start "SentinelRx Backend" cmd /k "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
echo.
echo 2. Starting Frontend on http://localhost:3005 ...
start "SentinelRx Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo Both servers are starting. Wait for "ready" messages.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3005
echo.
pause
