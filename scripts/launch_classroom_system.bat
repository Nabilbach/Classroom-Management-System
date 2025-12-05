@echo off
setlocal ENABLEDELAYEDEXPANSION
chcp 65001 >nul

title Classroom Management System Launcher (Stable)
color 0a

echo ============================================================================
echo                  Classroom Management System - Launcher
echo ============================================================================

REM Project root
set PROJECT_DIR=C:\Users\nabil\OneDrive\Documents\Classroom Management System
cd /d "%PROJECT_DIR%"

REM 1) Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
  echo ❌ Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)

echo ✔ Node.js detected

REM 2) Ensure dependencies (only if node_modules missing)
if not exist "%PROJECT_DIR%\node_modules" (
  echo 📦 Installing root dependencies (first time)...
  call npm install || (echo ❌ Failed root install & pause & exit /b 1)
)

if not exist "%PROJECT_DIR%\backend\node_modules" (
  echo 📦 Installing backend dependencies (first time)...
  pushd backend
  call npm install || (echo ❌ Failed backend install & pause & exit /b 1)
  popd
)

echo ✔ Dependencies ready

echo 🔄 Stopping previous Node processes (if any)...
taskkill /IM node.exe /F >nul 2>&1

REM 3) Start backend
set BACKEND_DIR=%PROJECT_DIR%\backend
set BACKEND_PORT=3000

echo 🚀 Starting backend on port %BACKEND_PORT% ...
start "CMS Backend" cmd /c "cd /d %BACKEND_DIR% && node index.js"

REM Wait a little then test port
call :WaitForPort %BACKEND_PORT% 25 "Backend"
if errorlevel 1 (
  echo ❌ Backend did not start. Check backend\index.js
  goto :END
)

echo ✔ Backend running: http://localhost:%BACKEND_PORT%

echo 🌐 Starting frontend (Vite)...
start "CMS Frontend" cmd /c "cd /d %PROJECT_DIR% && npm run dev"

REM Vite default port
set FRONTEND_PORT=5173
call :WaitForPort %FRONTEND_PORT% 40 "Frontend"
if errorlevel 1 (
  echo ⚠ Frontend might still be compiling. Will continue.
) else (
  echo ✔ Frontend running: http://localhost:%FRONTEND_PORT%
)

echo.
echo ============================================================================
echo ✅ System Ready
echo Backend:  http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo ============================================================================

echo 🔍 Opening browser...
start "" "http://localhost:%FRONTEND_PORT%"
rem Fallback open attempts
powershell -command "Start-Process 'http://localhost:%FRONTEND_PORT%'" >nul 2>&1
explorer "http://localhost:%FRONTEND_PORT%" >nul 2>&1

echo.
echo ℹ To stop: close the two windows named:
echo    - CMS Backend
echo    - CMS Frontend
echo Or run: taskkill /IM node.exe /F

echo.
choice /t 5 /d Y /n >nul
exit /b 0

:WaitForPort
REM %1=port, %2=max seconds, %3=label
set PORT=%1
set MAX=%2
set LABEL=%3
set /a COUNT=0
:WAIT_LOOP
>nul 2>&1 (call ) && (for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT%"') do (
  echo [%LABEL%] Port %PORT% is responding.
  exit /b 0
))
set /a COUNT+=1
if %COUNT% GEQ %MAX% exit /b 1
ping 127.0.0.1 -n 2 >nul
goto :WAIT_LOOP

:END
pause
exit /b 1