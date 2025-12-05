@echo off
REM Start Electron App Silently
REM This batch file launches the Electron app without showing the console

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

REM Start the electron app
start "" cmd /c "npm run electron:dev"

exit
