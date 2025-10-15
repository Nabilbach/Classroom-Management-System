@echo off
title Classroom Management System

echo ============================================
echo    Classroom Management System
echo    نظام إدارة الفصول الدراسية
echo ============================================
echo.
echo Starting the application...
echo Please wait 10-20 seconds...
echo.

cd /d "%~dp0"

REM Start backend in minimized window
echo [1/2] Starting backend server...
start /min "CMS-Backend" cmd /c "cd backend && node index.js"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend and open browser
echo [2/2] Starting frontend...
start "" cmd /c "npm run dev && pause"

REM Wait 8 seconds then open browser
echo.
echo Waiting for servers to start...
timeout /t 8 /nobreak

REM Open default browser
echo.
echo Opening browser...
start http://localhost:5173

echo.
echo ============================================
echo    Application is running!
echo    Check your browser window
echo ============================================
echo.
echo Press any key to stop all servers...
pause >nul

REM Kill all node processes to stop servers
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo Servers stopped.
timeout /t 2 >nul
