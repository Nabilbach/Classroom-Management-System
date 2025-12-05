@echo off
chcp 65001 >nul
title Classroom Management System - Auto Start

echo ================================
echo   نظام إدارة الصف الدراسي
echo   Classroom Management System
echo ================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && node index.js"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Backup Service...
start "Backup Service" cmd /k "node smart_backup_service.cjs"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ✅ All services started successfully!
echo.
echo Windows opened:
echo   - Backend Server (Port 3000)
echo   - Backup Service (Every 6 hours)
echo   - Frontend (Port 5173)
echo.
echo You can close this window now.
echo ================================
timeout /t 5
exit
