@echo off
cd /d "C:\Users\nabil\Projects\Classroom-Management-System"

echo ========================================
echo   Classroom Management System
echo   Desktop Application Launcher
echo ========================================
echo.
echo Starting application...
echo This will:
echo  1. Start Vite development server
echo  2. Wait for server to be ready
echo  3. Launch Electron desktop window
echo.
echo Please wait, this may take 15-20 seconds...
echo.

REM Use the proper npm script that handles everything
npm run electron:dev
