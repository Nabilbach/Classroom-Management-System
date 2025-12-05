@echo off
cd /d "C:\Users\nabil\Projects\Classroom-Management-System"
set NODE_ENV=development

echo Starting Classroom Desktop App...
echo.
echo [1/3] Starting Vite development server...
start /B npm run dev >nul 2>&1

echo [2/3] Waiting for Vite to be ready (15 seconds)...
timeout /t 15 /nobreak >nul

echo [3/3] Launching Electron window...
echo.
echo Please wait, the application window will appear shortly...

start "" ".\node_modules\.bin\electron.cmd" .
