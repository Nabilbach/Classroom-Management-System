@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════════════
echo                    🚀 نظام إدارة الفصول المحسن
echo ═══════════════════════════════════════════════════════════════════
echo.

echo 🔍 فحص سريع للنظام...
node system_monitor.cjs

echo.
echo 📋 الخيارات المتاحة:
echo   1. تشغيل النظام كاملاً
echo   2. الواجهة الأمامية فقط
echo   3. الخادم الخلفي فقط  
echo   4. نسخة احتياطية فورية
echo   5. فحص صحة النظام
echo   6. عرض إحصائيات النسخ الاحتياطي
echo   0. خروج
echo.

:menu
set /p choice="اختر الرقم: "

if "%choice%"=="1" goto full_system
if "%choice%"=="2" goto frontend_only
if "%choice%"=="3" goto backend_only
if "%choice%"=="4" goto backup_now
if "%choice%"=="5" goto health_check
if "%choice%"=="6" goto backup_status
if "%choice%"=="0" goto exit
echo ⚠️ اختيار غير صالح!
goto menu

:full_system
echo.
echo 🚀 بدء تشغيل النظام كاملاً...
echo.
echo 📂 تشغيل النسخ الاحتياطي التلقائي...
start "Backup Service" cmd /k "node automated_backup_service.cjs start"
timeout /t 2 /nobreak >nul

echo ⚙️ تشغيل الخادم الخلفي...
start "Backend" cmd /k "npm run prod:backend"
timeout /t 3 /nobreak >nul

echo 🖥️ تشغيل الواجهة الأمامية...
start "Frontend" cmd /k "npm run prod:frontend"
timeout /t 3 /nobreak >nul

echo 🌐 فتح المتصفح...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ✅ تم تشغيل النظام بنجاح!
echo 🔗 الرابط: http://localhost:5173
pause
goto menu

:frontend_only
echo.
echo 🖥️ تشغيل الواجهة الأمامية...
npm run prod:frontend
goto menu

:backend_only
echo.
echo ⚙️ تشغيل الخادم الخلفي...
npm run prod:backend  
goto menu

:backup_now
echo.
echo 📂 إنشاء نسخة احتياطية فورية...
node automated_backup_service.cjs backup
pause
goto menu

:health_check
echo.
echo 🏥 فحص صحة النظام...
echo ═══════════════════════════════════════════════════════════════════
node system_monitor.cjs
pause
goto menu

:backup_status
echo.
echo 📊 حالة النسخ الاحتياطي...
echo ═══════════════════════════════════════════════════════════════════
node automated_backup_service.cjs status
pause
goto menu

:exit
echo.
echo 👋 شكراً لاستخدام النظام!
timeout /t 2 /nobreak >nul
exit /b 0