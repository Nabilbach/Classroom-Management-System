@echo off
title Classroom Management System - Frontend Only
cd /d "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
echo Starting FRONTEND (Vite)...
echo Make sure BACKEND is running (window title: CMS Backend)
npm run dev
echo.
echo If build finished OK, open: http://localhost:5173
echo Press any key to exit.
pause >nul
