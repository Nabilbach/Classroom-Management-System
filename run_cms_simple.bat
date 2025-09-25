@echo off
title Classroom Management System - Simple Starter
REM Do not close automatically.

cd /d "C:\Users\nabil\OneDrive\Documents\Classroom Management System"

echo =============================================================
echo  CLASSROOM MANAGEMENT SYSTEM - SIMPLE MODE
echo =============================================================
echo 1) A backend window will be opened and will stay running.
echo 2) A frontend (web) window can be started manually (optional).
echo 3) Open the link:  http://localhost:5173   after starting frontend.
echo.
echo Starting BACKEND only now...
start "CMS Backend" cmd /k "cd backend && node index.js"
echo.
echo If you also want the FRONTEND now press Y then Enter.
set /p STARTFE=Start frontend now? (Y/N): 
if /I "%STARTFE%"=="Y" (
  echo Starting FRONTEND...
  start "CMS Frontend" cmd /k "cd \"C:\Users\nabil\OneDrive\Documents\Classroom Management System\" && npm run dev"
) else (
  echo You can start frontend later by double-clicking: run_frontend_only.bat
)
echo.
echo ================== INSTRUCTIONS ==================
echo Backend window title: CMS Backend
echo Frontend window title: CMS Frontend (if started)
echo To open the site (after frontend starts): http://localhost:5173
echo To stop: Close the backend and frontend windows.
echo ===================================================
echo.
pause
