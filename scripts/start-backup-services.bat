@echo off
echo 🛡️ بدء خدمات النسخ الاحتياطي للنظام...
echo.

REM التأكد من وجود Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js غير مثبت! يرجى تثبيت Node.js أولاً
    pause
    exit /b 1
)

echo ✅ Node.js متوفر
echo.

REM التأكد من وجود الملفات المطلوبة
if not exist "services_manager.cjs" (
    echo ❌ ملف services_manager.cjs غير موجود!
    pause
    exit /b 1
)

echo ✅ الملفات المطلوبة موجودة
echo.

REM إنشاء نسخة احتياطية فورية أولاً
echo 📦 إنشاء نسخة احتياطية فورية...
node services_manager.cjs immediate

echo.
echo 🚀 تشغيل خدمات النسخ الاحتياطي...
echo 📝 لعرض الحالة في نافذة جديدة: npm run backup:status
echo 🛑 للإيقاف: اضغط Ctrl+C
echo.

REM تشغيل الخدمات
node services_manager.cjs start

pause