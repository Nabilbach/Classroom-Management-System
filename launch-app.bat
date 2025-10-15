@echo off
REM Launch Electron App - Classroom Management System
REM This will start the development server and open the Electron window

echo Starting Classroom Management System...
echo Please wait...

cd /d "%~dp0"

REM Start electron in development mode
start /min cmd /c "npm run electron:dev"

REM Exit this console
exit
