@echo off
REM Minimal frontend starter
cd /d "%~dp0" || (
  echo ERROR: Cannot change directory to project root
  pause
  exit /b 1
)
echo Starting FRONTEND (npm run dev)...
npm run dev
echo.
echo Frontend stopped. Press any key to close.
pause >nul
