@echo off
cd /d "C:\Users\nabil\Projects\Classroom-Management-System"
set NODE_ENV=development

echo ========================================
echo   Classroom Management System
echo ========================================
echo.
echo Starting application, please wait...
echo.

REM Kill any existing processes
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1

REM Start Vite in background (minimized)
echo [1/2] Starting development server...
start /MIN cmd /c "npm run dev"

REM Wait for Vite to be ready
echo [2/2] Waiting for server to start (15 seconds)...
timeout /t 15 /nobreak >nul

REM Launch Electron (this window will close)
echo.
echo Launching application window...
start "" ".\node_modules\.bin\electron.cmd" .

REM Close this launcher window
exit
