@echo off
cd /d "%~dp0frontend"
if not exist node_modules npm install
echo Frontend at http://localhost:5173
npm run dev
pause
