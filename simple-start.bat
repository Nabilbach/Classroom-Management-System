@echo off
title Classroom Management System - Starting...
color 0a

echo ================================================================
echo                Classroom Management System
echo                      Starting Server...
echo ================================================================
echo.

REM Navigate to project directory
cd /d "C:\Users\nabil\OneDrive\Documents\Classroom Management System"

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [INFO] Node.js found - Starting servers...
echo.

REM Kill any existing node processes
taskkill /IM node.exe /F >nul 2>&1

REM Start Backend Server
echo [STEP 1/4] Starting Backend Server...
cd backend
start /min "Backend Server" cmd /c "node index.js & pause"
cd ..

REM Wait for backend to start
echo [STEP 2/4] Waiting for Backend Server...
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo [STEP 3/4] Starting Frontend Server...
start /min "Frontend Server" cmd /c "npm run dev & pause"

REM Wait for frontend to start
echo [STEP 4/4] Waiting for Frontend Server...
timeout /t 8 /nobreak >nul

echo.
echo ================================================================
echo                   System Ready!
echo ================================================================
echo.
echo Backend API: http://localhost:3000
echo Frontend:    http://localhost:5173
echo.

REM Try to open browser multiple ways
echo Opening browser...
start "" "http://localhost:5173"
timeout /t 2 /nobreak >nul

REM Alternative browser opening methods
powershell -command "Start-Process 'http://localhost:5173'" >nul 2>&1
explorer "http://localhost:5173" >nul 2>&1

echo.
echo If browser didn't open, manually go to: http://localhost:5173
echo.
echo To stop servers: Close the minimized CMD windows
echo                  or run: taskkill /IM node.exe /F
echo.
pause