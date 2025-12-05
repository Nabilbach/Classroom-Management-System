# نظام إدارة الفصول الدراسية - دليل البيئات المتعددة
# Classroom Management System - Multi-Environment Guide

## 🎯 نظرة عامة | Overview

تم إعداد النظام بحيث يدعم بيئتين منفصلتين لضمان حماية البيانات الحقيقية أثناء التطوير:

The system has been configured to support two separate environments to ensure real data protection during development:

- **البيئة الإنتاجية (Production)**: للعمل اليومي مع بيانات الطلاب الحقيقية
- **بيئة التطوير (Development)**: للتطوير والاختبار بأمان تام

## 📁 هيكل المجلدات | Folder Structure

```
📂 Classroom Management System (الإنتاج)
├── 📊 classroom.db (قاعدة البيانات الأساسية)
├── 🔧 .env.production
├── 🗂️ backend/
└── 🖥️ src/

📂 Classroom Management System - Development (التطوير)
├── 📊 classroom_dev.db (قاعدة بيانات التطوير)
├── 🔧 .env.development
├── 🗂️ backend/
└── 🖥️ src/
```

## 🚀 كيفية التشغيل | How to Run

### 🔴 البيئة الإنتاجية | Production Environment

```powershell
# التشغيل الكامل
.\manage-environments.ps1 -Action production

# تشغيل الخادم فقط
.\manage-environments.ps1 -Action production -Component backend

# تشغيل الواجهة فقط
.\manage-environments.ps1 -Action production -Component frontend
```

**المنافذ | Ports:**
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### 🟢 بيئة التطوير | Development Environment

```powershell
# التشغيل الكامل
.\manage-environments.ps1 -Action development

# تشغيل الخادم فقط
.\manage-environments.ps1 -Action development -Component backend

# تشغيل الواجهة فقط
.\manage-environments.ps1 -Action development -Component frontend
```

**المنافذ | Ports:**
- Backend: http://localhost:3001
- Frontend: http://localhost:5174

## 📋 الأوامر المفيدة | Useful Commands

### عرض حالة النظام | System Status
```powershell
.\manage-environments.ps1 -Action status
```

### إنشاء نسخة احتياطية | Create Backup
```powershell
.\manage-environments.ps1 -Action backup
```

### عرض المساعدة | Show Help
```powershell
.\manage-environments.ps1 -Action help
```

## 🛡️ حماية البيانات | Data Protection

### البيئة الإنتاجية | Production Environment
- ✅ **قاعدة البيانات**: `classroom.db` (البيانات الحقيقية)
- ✅ **النسخ الاحتياطية التلقائية**: يتم إنشاؤها قبل أي تحديث
- ✅ **Git Branch**: `main` (محمية من التغييرات المباشرة)
- ✅ **المنفذ**: 3000 (مخصص للإنتاج)

### بيئة التطوير | Development Environment
- 🧪 **قاعدة البيانات**: `classroom_dev.db` (نسخة آمنة للاختبار)
- 🧪 **التجارب الآمنة**: يمكن إعادة تعيين البيانات بدون خوف
- 🧪 **Git Branch**: `development` (للتطوير الآمن)
- 🧪 **المنفذ**: 3001 (منفصل عن الإنتاج)

## 🔄 سير العمل المقترح | Recommended Workflow

### 1. للتطوير اليومي | Daily Development
```powershell
# انتقل إلى بيئة التطوير
cd "C:\Users\nabil\OneDrive\Documents\Classroom Management System - Development"

# تشغيل بيئة التطوير
.\manage-environments.ps1 -Action development

# قم بالتطوير والاختبار بأمان
# Develop and test safely
```

### 2. للعمل مع الطلاب | Working with Students
```powershell
# انتقل إلى البيئة الإنتاجية
cd "C:\Users\nabil\OneDrive\Documents\Classroom Management System"

# أنشئ نسخة احتياطية أولاً
.\manage-environments.ps1 -Action backup

# تشغيل البيئة الإنتاجية
.\manage-environments.ps1 -Action production
```

### 3. نقل التحسينات من التطوير إلى الإنتاج | Moving Improvements to Production
```powershell
# في بيئة التطوير
git add .
git commit -m "إضافة ميزة جديدة"
git push origin development

# في البيئة الإنتاجية
git checkout main
git merge development
git push origin main
```

## 🗂️ ملفات التكوين | Configuration Files

### .env.production (البيئة الإنتاجية)
```env
NODE_ENV=production
PORT=3000
DB_PATH=classroom.db
VITE_API_URL=http://localhost:3000
```

### .env.development (بيئة التطوير)
```env
NODE_ENV=development
PORT=3001
DB_PATH=classroom_dev.db
VITE_API_URL=http://localhost:3001
```

## 🔧 النصائح والممارسات الجيدة | Tips & Best Practices

### ✅ افعل | Do
- استخدم بيئة التطوير لكل التجارب والاختبارات
- أنشئ نسخة احتياطية قبل أي تحديث في الإنتاج
- استخدم Git للتتبع والحفظ
- اختبر في بيئة التطوير قبل النقل للإنتاج

### ❌ لا تفعل | Don't
- لا تطور مباشرة في البيئة الإنتاجية
- لا تعدل قاعدة البيانات الإنتاجية مباشرة
- لا تشغل البيئتين على نفس المنافذ
- لا تنس إنشاء النسخ الاحتياطية

## 🆘 حل المشاكل | Troubleshooting

### المشكلة: المنفذ مستخدم | Problem: Port in Use
```powershell
# إيقاف العمليات على المنفذ
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### المشكلة: خطأ في قاعدة البيانات | Problem: Database Error
```powershell
# إنشاء نسخة احتياطية واستعادة
.\manage-environments.ps1 -Action backup
# ثم استعادة من النسخة الاحتياطية
```

### المشكلة: Git Conflicts
```powershell
# حل التعارضات
git status
git add .
git commit -m "حل التعارضات"
```

## 📞 الدعم | Support

عند مواجهة أي مشكلة:
1. تحقق من حالة النظام: `.\manage-environments.ps1 -Action status`
2. أنشئ نسخة احتياطية: `.\manage-environments.ps1 -Action backup`
3. راجع رسائل الخطأ في وحدة التحكم
4. استعد من النسخة الاحتياطية إذا لزم الأمر

---

## 📝 سجل التحديثات | Changelog

### الإصدار 1.0 | Version 1.0
- ✅ إعداد البيئة المزدوجة (إنتاج/تطوير)
- ✅ فصل قواعد البيانات والمنافذ
- ✅ سكريبت إدارة البيئات
- ✅ نظام النسخ الاحتياطي التلقائي
- ✅ إعداد Git Branching Strategy

---

**تم الإعداد بواسطة**: GitHub Copilot
**التاريخ**: سبتمبر 2025
**الهدف**: حماية البيانات التعليمية الحقيقية مع تمكين التطوير الآمن