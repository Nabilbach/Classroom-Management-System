@echo off
title Classroom Management System - TESTING
echo ======================================
echo  TESTING ENVIRONMENT - PORT 3002
echo  DATABASE: classroom_test.db
echo ======================================
echo.
echo Starting TESTING backend...
cd backend
set NODE_ENV=testing
set PORT=3002
set DB_PATH=classroom_test.db
node index.js
pause