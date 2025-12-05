@echo off
chcp 65001 >nul
title Classroom Management System - Production

:: Set colors and styling
color 0A

echo.
echo ============================================
echo     Classroom Management System
echo         Production Environment
echo ============================================
echo.

:: Change to the correct directory
cd /d "C:\Users\nabil\OneDrive\Documents\Classroom Management System"

:: Check if ports are already in use
echo [INFO] Checking ports availability...

:: Check port 3000 (Backend)
netstat -an | find "3000" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo [WARNING] Port 3000 is already in use. Stopping existing process...
    for /f "tokens=5" %%i in ('netstat -ano ^| find "3000" ^| find "LISTENING"') do (
        taskkill /PID %%i /F >nul 2>&1
    )
    timeout /t 2 >nul
)

:: Check port 5173 (Frontend)
netstat -an | find "5173" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo [WARNING] Port 5173 is already in use. Stopping existing process...
    for /f "tokens=5" %%i in ('netstat -ano ^| find "5173" ^| find "LISTENING"') do (
        taskkill /PID %%i /F >nul 2>&1
    )
    timeout /t 2 >nul
)

echo [INFO] Starting Backend Server (Port 3000)...
start "Backend Server" /min cmd /k "cd /d \"%~dp0backend\" && node index.js"

:: Wait for backend to start
timeout /t 5 >nul

echo [INFO] Starting Frontend Development Server (Port 5173)...
start "Frontend Server" /min cmd /k "cd /d \"%~dp0\" && npm run dev"

echo.
echo ============================================
echo     Application Started Successfully!
echo ============================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo [INFO] Both servers are running in minimized windows
echo [INFO] Close this window or press any key to open management interface
echo.

pause >nul

:: Open management interface
echo Opening management interface...
start "" "http://localhost:5173"

:: Keep this window open for management
:menu
cls
echo.
echo ============================================
echo     Classroom Management System
echo         Control Panel
echo ============================================
echo.
echo 1. Open Application (http://localhost:5173)
echo 2. Open Backend API (http://localhost:3000)
echo 3. Check System Status
echo 4. Stop All Servers
echo 5. Restart Servers
echo 6. Exit
echo.
set /p choice="Choose an option (1-6): "

if "%choice%"=="1" (
    start "" "http://localhost:5173"
    goto menu
)
if "%choice%"=="2" (
    start "" "http://localhost:3000"
    goto menu
)
if "%choice%"=="3" (
    call :check_status
    goto menu
)
if "%choice%"=="4" (
    call :stop_servers
    echo.
    echo All servers stopped. Press any key to exit...
    pause >nul
    exit
)
if "%choice%"=="5" (
    call :restart_servers
    goto menu
)
if "%choice%"=="6" (
    echo.
    echo Servers will continue running in background.
    echo Use option 4 to stop them completely.
    echo.
    pause
    exit
)

goto menu

:check_status
echo.
echo ============================================
echo          System Status Check
echo ============================================
echo.
netstat -an | find "3000" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo [✓] Backend Server: RUNNING on port 3000
) else (
    echo [✗] Backend Server: NOT RUNNING
)

netstat -an | find "5173" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo [✓] Frontend Server: RUNNING on port 5173
) else (
    echo [✗] Frontend Server: NOT RUNNING
)
echo.
echo Press any key to return to menu...
pause >nul
goto :eof

:stop_servers
echo.
echo [INFO] Stopping all servers...
for /f "tokens=5" %%i in ('netstat -ano ^| find "3000" ^| find "LISTENING"') do (
    taskkill /PID %%i /F >nul 2>&1
)
for /f "tokens=5" %%i in ('netstat -ano ^| find "5173" ^| find "LISTENING"') do (
    taskkill /PID %%i /F >nul 2>&1
)
echo [INFO] All servers stopped.
goto :eof

:restart_servers
call :stop_servers
timeout /t 3 >nul
echo [INFO] Restarting servers...
start "Backend Server" /min cmd /k "cd /d \"%~dp0backend\" && node index.js"
timeout /t 5 >nul
start "Frontend Server" /min cmd /k "cd /d \"%~dp0\" && npm run dev"
echo [INFO] Servers restarted successfully.
echo.
pause
goto :eof