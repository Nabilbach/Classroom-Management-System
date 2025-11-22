@echo off
set NODE_ENV=production
cd /d %~dp0
start "Classroom Management System" npx electron electron\main.cjs