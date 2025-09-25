@echo off
cd /d "C:\Users\nabil\OneDrive\Documents\Classroom Management System"

echo ================================================
echo    CLASSROOM MANAGEMENT SYSTEM
echo    Starting Backend and Frontend...
echo ================================================

echo [1] Starting Backend Server...
start "Backend" cmd /k "cd backend && node index.js"

echo [2] Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo [3] Starting Frontend...  
start "Frontend" cmd /k "npm run dev"

echo [4] Opening Browser...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo ✅ System Started Successfully!
echo - Backend: Running in separate window
echo - Frontend: Running in separate window  
echo - Browser: Opening http://localhost:5173
echo.
echo Close the Backend and Frontend windows to stop.
pause