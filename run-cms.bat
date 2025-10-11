@echo off
cd /d "%~dp0"
:: Start backend in new powershell window (port 3000)
start "Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "cd '$proj\\backend'; npm run prod:backend"
:: Start frontend in new powershell window (port 5173)
start "Frontend" powershell -NoExit -ExecutionPolicy Bypass -Command "cd '$proj'; npm run prod:frontend"
:: Start backup service
start "Backup" powershell -NoExit -ExecutionPolicy Bypass -Command "cd '$proj'; npm run backup:start"
:: Open browser
start "" "http://localhost:5173"

echo All services launched.
