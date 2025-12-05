@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════════════
echo                    🚀 بدء نظام إدارة الفصول المحسن
echo ═══════════════════════════════════════════════════════════════════
echo.

:: التحقق من وجود Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت! يرجى تثبيت Node.js أولاً
    pause
    exit /b 1
)

:: التحقق من وجود الملفات المطلوبة
if not exist "package.json" (
    echo ❌ ملف package.json غير موجود!
    pause
    exit /b 1
)

if not exist "automated_backup_service.cjs" (
    echo ❌ خدمة النسخ الاحتياطي غير موجودة!
    pause
    exit /b 1
)

if not exist "backup_monitoring_service.cjs" (
    echo ❌ خدمة المراقبة غير موجودة!
    pause
    exit /b 1
)

echo 🔍 إجراء فحص صحي أولي...
node backup_monitoring_service.cjs check

echo.
echo 📋 القائمة المتاحة:
echo   1. تشغيل النظام كاملاً (موصى به)
echo   2. تشغيل الواجهة الأمامية فقط
echo   3. تشغيل الخادم الخلفي فقط  
echo   4. تشغيل خدمة النسخ الاحتياطي فقط
echo   5. تشغيل خدمة المراقبة فقط
echo   6. إجراء نسخة احتياطية فورية
echo   7. فحص صحة النظام
echo   8. عرض حالة الخدمات
echo   9. تنظيف النسخ الاحتياطية القديمة
echo   0. خروج
echo.

:menu
set /p choice="اختر الرقم المطلوب: "

if "%choice%"=="1" goto full_system
if "%choice%"=="2" goto frontend_only
if "%choice%"=="3" goto backend_only
if "%choice%"=="4" goto backup_only
if "%choice%"=="5" goto monitor_only
if "%choice%"=="6" goto immediate_backup
if "%choice%"=="7" goto health_check
if "%choice%"=="8" goto status_check
if "%choice%"=="9" goto cleanup_backups
if "%choice%"=="0" goto exit
echo ⚠️ اختيار غير صالح! حاول مرة أخرى.
goto menu

:full_system
echo.
echo 🚀 بدء تشغيل النظام كاملاً...
echo ═══════════════════════════════════════════════════════════════════
echo.

echo 📂 1/5 - تشغيل خدمة النسخ الاحتياطي...
start "Backup Service" cmd /k "node automated_backup_service.cjs start"
timeout /t 2 /nobreak >nul

echo 🔍 2/5 - تشغيل خدمة المراقبة...  
start "Monitoring Service" cmd /k "node backup_monitoring_service.cjs start"
timeout /t 2 /nobreak >nul

echo ⚙️ 3/5 - تشغيل الخادم الخلفي...
start "Backend Server" cmd /k "npm run prod:backend"
timeout /t 3 /nobreak >nul

echo 🖥️ 4/5 - تشغيل الواجهة الأمامية...
start "Frontend Server" cmd /k "npm run prod:frontend"
timeout /t 3 /nobreak >nul

echo 🌐 5/5 - فتح المتصفح...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ✅ تم تشغيل النظام بنجاح!
echo 🔗 الرابط: http://localhost:5173
echo 📊 لمراقبة النظام، راجع نوافذ الخدمات المفتوحة
echo.
echo اضغط أي زر للعودة للقائمة أو أغلق النافذة...
pause >nul
goto menu

:frontend_only
echo.
echo 🖥️ تشغيل الواجهة الأمامية فقط...
npm run prod:frontend
goto menu

:backend_only
echo.
echo ⚙️ تشغيل الخادم الخلفي فقط...
npm run prod:backend  
goto menu

:backup_only
echo.
echo 📂 تشغيل خدمة النسخ الاحتياطي...
start "Backup Service" cmd /k "node automated_backup_service.cjs start"
echo ✅ تم بدء خدمة النسخ الاحتياطي في نافذة منفصلة
timeout /t 2 /nobreak >nul
goto menu

:monitor_only
echo.
echo 🔍 تشغيل خدمة المراقبة...
start "Monitoring Service" cmd /k "node backup_monitoring_service.cjs start"
echo ✅ تم بدء خدمة المراقبة في نافذة منفصلة
timeout /t 2 /nobreak >nul
goto menu

:immediate_backup
echo.
echo 📂 إجراء نسخة احتياطية فورية...
node automated_backup_service.cjs backup
echo.
echo اضغط أي زر للمتابعة...
pause >nul
goto menu

:health_check
echo.
echo 🏥 إجراء فحص صحي شامل...
echo ═══════════════════════════════════════════════════════════════════
npm run system:health
echo.
echo اضغط أي زر للمتابعة...
pause >nul
goto menu

:status_check
echo.
echo 📊 فحص حالة الخدمات...
echo ═══════════════════════════════════════════════════════════════════
npm run services:status
echo.
echo اضغط أي زر للمتابعة...
pause >nul
goto menu

:cleanup_backups
echo.
echo 🧹 تنظيف النسخ الاحتياطية القديمة...
node automated_backup_service.cjs cleanup
echo.
echo اضغط أي زر للمتابعة...
pause >nul
goto menu

:exit
echo.
echo 👋 وداعاً! شكراً لاستخدام نظام إدارة الفصول
timeout /t 2 /nobreak >nul
exit /b 0