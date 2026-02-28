@echo off
cd /d "%~dp0backend"
call .venv\Scripts\activate.bat
rem DATABASE_URL is read from backend\.env - do not override
echo Backend at http://localhost:8000
uvicorn app.main:app --reload
pause
