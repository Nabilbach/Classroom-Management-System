@echo off
REM Ultra-simple launcher (separate windows, no Unicode, no emojis)
set ROOT=%~dp0
cd /d "%ROOT%" || (echo ERROR: invalid root path & pause & exit /b 1)

echo ===============================
echo  CLASSROOM MANAGEMENT SYSTEM
echo  SIMPLE LAUNCHER
echo ===============================
echo.
echo 1) Opening BACKEND window...
start "CMS_BACKEND" cmd /k "cd /d \"%ROOT%backend\" && node index.js"
echo 2) Opening FRONTEND window...
start "CMS_FRONTEND" cmd /k "cd /d \"%ROOT%\" && npm run dev"
echo.
echo When frontend finishes, open: http://localhost:5173
echo Backend API (optional):      http://localhost:3000
echo.
echo Close the two windows to stop the system.
echo This window can now be closed.
pause >nul
exit /b 0