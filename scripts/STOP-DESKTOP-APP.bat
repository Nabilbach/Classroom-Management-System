@echo off
echo Stopping Classroom Management System...
echo.

REM Kill all related processes
taskkill /F /IM electron.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo Application stopped successfully.
echo.
timeout /t 2 /nobreak >nul
