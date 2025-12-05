@echo off
rem SIMPLE RELIABLE STARTER - ASCII ONLY
title Classroom Management System - STARTER
cd /d "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
echo ==============================================
echo  STARTING CLASSROOM MANAGEMENT SYSTEM
echo  (Close the two windows to stop)
echo ==============================================
echo.
echo 1) Starting BACKEND...
start "CMS Backend" cmd /k "cd backend && node index.js"
rem wait a little so backend initializes
timeout /t 3 /nobreak >nul
echo 2) Starting FRONTEND...
start "CMS Frontend" cmd /k "cd \"C:\Users\nabil\OneDrive\Documents\Classroom Management System\" && npm run dev"
echo.
echo If browser does not open automatically, open: http://localhost:5173
echo Backend API (optional): http://localhost:3000
echo.
echo DONE. You can minimize this window. (It is safe to close now.)
pause >nul
exit /b 0
