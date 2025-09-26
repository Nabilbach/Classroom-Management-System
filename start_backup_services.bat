@echo off
echo ========================================
echo       نظام الحماية والنسخ الاحتياطي
echo    Backup and Monitoring System Starter
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] فحص متطلبات النظام...

:: التحقق من وجود Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js غير مثبت! يرجى تثبيت Node.js أولاً
    pause
    exit /b 1
)

:: التحقق من وجود ملفات النظام
if not exist "classroom.db" (
    echo [WARNING] ملف قاعدة البيانات classroom.db غير موجود
)

if not exist "backup_config.json" (
    echo [INFO] إنشاء ملف الإعدادات الافتراضي...
    node automated_backup_service.cjs status >nul 2>&1
)

echo [INFO] بدء تشغيل خدمات النسخ الاحتياطي والمراقبة...
echo.

:: إنشاء مجلدات ضرورية
if not exist "automated_backups" mkdir "automated_backups"
if not exist "health_reports" mkdir "health_reports"

echo ========================================
echo اختر الخدمة المطلوبة:
echo ========================================
echo 1. تشغيل جميع الخدمات (مستحسن)
echo 2. النسخ الاحتياطي فقط
echo 3. المراقبة فقط
echo 4. فحص النظام السريع
echo 5. إنشاء نسخة احتياطية فورية
echo 6. عرض حالة النظام
echo 7. إعدادات النظام
echo 0. خروج
echo ========================================
set /p choice="أدخل اختيارك (1-7): "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_backup
if "%choice%"=="3" goto start_monitoring
if "%choice%"=="4" goto quick_check
if "%choice%"=="5" goto immediate_backup
if "%choice%"=="6" goto show_status
if "%choice%"=="7" goto show_settings
if "%choice%"=="0" goto exit
goto invalid_choice

:start_all
echo [INFO] تشغيل جميع الخدمات...
start "خدمة النسخ الاحتياطي" cmd /k "echo تشغيل خدمة النسخ الاحتياطي... && node automated_backup_service.cjs start"
timeout /t 2 /nobreak >nul
start "خدمة المراقبة" cmd /k "echo تشغيل خدمة المراقبة... && node backup_monitoring_service.js start"
echo [SUCCESS] تم تشغيل جميع الخدمات في نوافذ منفصلة
goto end

:start_backup
echo [INFO] تشغيل خدمة النسخ الاحتياطي فقط...
start "خدمة النسخ الاحتياطي" cmd /k "node automated_backup_service.cjs start"
echo [SUCCESS] تم تشغيل خدمة النسخ الاحتياطي
goto end

:start_monitoring
echo [INFO] تشغيل خدمة المراقبة فقط...
start "خدمة المراقبة" cmd /k "node backup_monitoring_service.js start"
echo [SUCCESS] تم تشغيل خدمة المراقبة
goto end

:quick_check
echo [INFO] تشغيل الفحص السريع...
echo.
node backup_monitoring_service.js check
echo.
goto end

:immediate_backup
echo [INFO] إنشاء نسخة احتياطية فورية...
echo.
node automated_backup_service.cjs backup
echo.
goto end

:show_status
echo [INFO] عرض حالة النظام...
echo.
echo ===== حالة النسخ الاحتياطي =====
node automated_backup_service.cjs status
echo.
echo ===== حالة المراقبة =====
node backup_monitoring_service.js stats
echo.
goto end

:show_settings
echo [INFO] عرض إعدادات النظام...
echo.
if exist "backup_config.json" (
    echo ===== ملف الإعدادات =====
    type "backup_config.json"
) else (
    echo لا يوجد ملف إعدادات
)
echo.
goto end

:invalid_choice
echo [ERROR] اختيار غير صحيح!
timeout /t 2 /nobreak >nul
cls
goto main

:end
echo.
echo ========================================
echo          تم تنفيذ العملية بنجاح
echo ========================================
echo.
pause

:exit
echo شكراً لاستخدام نظام الحماية والنسخ الاحتياطي
exit /b 0