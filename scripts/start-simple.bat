@echo off
echo ========================================
echo   Classroom Management System
echo   Starting Application...
echo ========================================
echo.

REM Change to project directory
cd /d "%~dp0"

echo [1/3] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js found

echo.
echo [2/3] Starting development server...
echo This may take 10-30 seconds on first run...
echo.

REM Open in default browser after 5 seconds
start /min cmd /c "timeout /t 5 >nul && start http://localhost:5173"

REM Start the dev server (this will block)
npm run dev

pause
