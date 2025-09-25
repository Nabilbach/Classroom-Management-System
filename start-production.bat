@echo off
title Classroom Management System - PRODUCTION
echo ======================================
echo  PRODUCTION ENVIRONMENT - PORT 3000
echo  DATABASE: classroom.db
echo ======================================
echo.
echo Starting PRODUCTION backend...
cd backend
set NODE_ENV=production
set PORT=3000
set DB_PATH=classroom.db
node index.js
pause