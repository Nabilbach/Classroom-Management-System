@echo off
REM ==================================================================
REM  SIMPLE LAUNCHER (Fixed) - Starts backend + frontend + opens browser
REM  تم تبسيط السكربت لإزالة أي سبب لرسالة: The filename ... is incorrect
REM ==================================================================

REM احصل على مسار المجلد الحالي (دائماً ينتهي بعلامة \ )
set "ROOT=%~dp0"

REM إزالة علامات اقتباس زائدة محتملة ومنع ROOT الفارغ
if not exist "%ROOT%" (
  echo ERROR: ROOT path not found: %ROOT%
  pause
  exit /b 1
)

REM تأكد من وجود backend و package.json
if not exist "%ROOT%backend" (
  echo ERROR: backend folder not found: "%ROOT%backend"
  pause
  exit /b 1
)
if not exist "%ROOT%package.json" (
  echo ERROR: package.json not found in root: "%ROOT%"
  pause
  exit /b 1
)

cls
echo =============================================================
echo  CLASSROOM MANAGEMENT SYSTEM - START
echo  ROOT: %ROOT%
echo =============================================================
echo.
echo [1/3] Starting BACKEND ...
start "CMS_BACKEND" cmd /k "cd /d \"%ROOT%backend\" && node index.js"
if errorlevel 1 echo WARNING: backend start command returned non-zero.

echo Waiting 3 seconds...
ping 127.0.0.1 -n 3 >nul

echo [2/3] Starting FRONTEND ...
start "CMS_FRONTEND" cmd /k "cd /d \"%ROOT%\" && npm run dev"
if errorlevel 1 echo WARNING: frontend start command returned non-zero.

echo [3/3] Opening browser (http://localhost:5173) ...
start "" "http://localhost:5173"

echo.
echo =============================================================
echo  DONE.
echo  Windows started:
echo    - CMS_BACKEND  (Backend server)
echo    - CMS_FRONTEND (Frontend dev server)
echo  If browser did not open, open manually: http://localhost:5173
echo  To stop: close the two windows.
echo =============================================================
echo.
echo You can close this launcher window now.
pause
exit /b 0
