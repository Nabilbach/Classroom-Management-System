@echo off
set "ROOT=%~dp0"
if not exist "%ROOT%backend" (
  echo ERROR: backend folder not found at "%ROOT%backend"
  pause
  exit /b 1
)
if not exist "%ROOT%package.json" (
  echo ERROR: package.json not found in "%ROOT%"
  pause
  exit /b 1
)
echo Starting Classroom backend...
start "Classroom Backend" cmd /k "cd /d \"%ROOT%backend\" && node index.js"
ping 127.0.0.1 -n 3 >nul
echo Starting Classroom frontend...
start "Classroom Frontend" cmd /k "cd /d \"%ROOT%\" && npm run dev"
echo Opening browser to http://localhost:5173
start "" "http://localhost:5173"
echo All processes launched. Close server windows to stop.
pause
exit /b 0
