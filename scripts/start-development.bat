@echo off
title Classroom Management System - DEVELOPMENT
echo ======================================
echo  DEVELOPMENT ENVIRONMENT - PORT 3001
echo  DATABASE: classroom_dev.db
echo ======================================
echo.
echo Starting DEVELOPMENT backend...
cd backend
set NODE_ENV=development
set PORT=3001
set DB_PATH=classroom_dev.db
node index.js
pause