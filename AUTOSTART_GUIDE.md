# 🚀 دليل التشغيل التلقائي - Auto-Start Guide

## المشكلة
حالياً يجب تشغيل الخدمات يدوياً في كل مرة:
- ❌ Backend Server
- ❌ Backup Service  
- ❌ Frontend

---

## ✅ الحل: التشغيل التلقائي

تم إنشاء ملفات لتشغيل كل شيء تلقائياً!

---

## 🎯 الخيار 1: تشغيل يدوي سريع (موصى به للمبتدئين)

### استخدم الملف الجديد:
```
START_ALL_SERVICES.bat
```

**كيف تستخدمه:**
1. **انقر نقراً مزدوجاً** على الملف
2. ستفتح 3 نوافذ تلقائياً:
   - Backend Server ✅
   - Backup Service ✅
   - Frontend ✅
3. انتظر 10 ثوانٍ
4. افتح المتصفح على: `http://localhost:5173`

**المميزات:**
- ✅ سريع وسهل
- ✅ يشغّل كل شيء بأمر واحد
- ✅ يمكن إغلاق النافذة الرئيسية بعد التشغيل

---

## 🔥 الخيار 2: تشغيل تلقائي عند بدء الويندوز (للمستخدمين المتقدمين)

### الخطوات:

#### 1. افتح PowerShell كمسؤول
```powershell
# انقر بزر الماوس الأيمن على أيقونة ويندوز
# اختر "Windows PowerShell (Admin)" أو "Terminal (Admin)"
```

#### 2. شغّل سكريبت الإعداد
```powershell
cd "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup_autostart.ps1
```

#### 3. تم! 🎉
- سيتم تشغيل النظام **تلقائياً** عند كل مرة تشغّل فيها الويندوز
- لن تحتاج لفعل أي شيء

---

## 📋 ماذا يحدث عند التشغيل التلقائي؟

```
1. يبدأ الويندوز
   ↓
2. يشتغل Backend Server تلقائياً (Port 3000)
   ↓
3. يشتغل Backup Service تلقائياً (كل 6 ساعات)
   ↓
4. يشتغل Frontend تلقائياً (Port 5173)
   ↓
5. كل شيء جاهز! 🟢
```

---

## ⚙️ إدارة التشغيل التلقائي

### لإيقاف التشغيل التلقائي:
```powershell
# احذف الاختصار من مجلد Startup:
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ClassroomSystem.lnk"
```

### للتحقق من وجود التشغيل التلقائي:
```powershell
Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ClassroomSystem.lnk"
```
- إذا كانت النتيجة `True` = التشغيل التلقائي مفعّل ✅
- إذا كانت النتيجة `False` = التشغيل التلقائي غير مفعّل ❌

---

## 🔍 استكشاف الأخطاء

### المشكلة 1: النوافذ تفتح ولكن تظهر أخطاء
```
الحل: تأكد من أن:
- Node.js مثبت بشكل صحيح
- جميع dependencies مثبتة (npm install)
- لا توجد عمليات Node أخرى تعمل على نفس المنافذ
```

### المشكلة 2: التشغيل التلقائي لا يعمل
```powershell
# تحقق من وجود الاختصار:
Get-ChildItem "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup" | Where-Object {$_.Name -like "*Classroom*"}

# إذا لم يكن موجوداً، أعد تشغيل setup_autostart.ps1
```

### المشكلة 3: النوافذ تفتح وتغلق بسرعة
```
الحل: افتح CMD وشغّل الملف يدوياً لرؤية الأخطاء:
cd "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
START_ALL_SERVICES.bat
```

---

## 📊 مقارنة الخيارات

| الميزة | الخيار 1 (يدوي) | الخيار 2 (تلقائي) |
|--------|------------------|-------------------|
| سهولة الإعداد | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| راحة الاستخدام | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| التحكم | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| للمبتدئين | ✅ مناسب | ⚠️ متوسط |
| استهلاك الموارد | منخفض | متوسط |

---

## 💡 نصائح

### للاستخدام اليومي:
1. **استخدم الخيار 1** إذا كنت تريد التحكم الكامل
2. **استخدم الخيار 2** إذا كنت تستخدم النظام يومياً

### لتوفير الموارد:
```powershell
# أغلق النوافذ عندما لا تحتاجها:
taskkill /F /IM node.exe
```

### للتطوير:
- استخدم الخيار 1 حتى تتمكن من رؤية الأخطاء والـ logs بسهولة

---

## 🎯 الخلاصة

### ما تم إنشاؤه:
1. ✅ `START_ALL_SERVICES.bat` - ملف تشغيل سريع
2. ✅ `setup_autostart.ps1` - سكريبت التشغيل التلقائي
3. ✅ `AUTOSTART_GUIDE.md` - هذا الدليل

### الخطوة التالية (اختر واحدة):

**للمبتدئين:**
```
انقر نقراً مزدوجاً على: START_ALL_SERVICES.bat
```

**للمستخدمين المتقدمين:**
```powershell
PowerShell (كمسؤول) → .\setup_autostart.ps1
```

---

## 📞 المساعدة

### الملفات المرجعية:
- `RED_INDICATOR_FIX.md` - حل المؤشر الأحمر
- `BACKUP_SYSTEM_REPORT.md` - تقرير النسخ الاحتياطي الكامل
- `BACKUP_USAGE_GUIDE.md` - دليل الاستخدام

---

**تاريخ الإنشاء:** 2 أكتوبر 2025  
**الحالة:** ✅ جاهز للاستخدام
