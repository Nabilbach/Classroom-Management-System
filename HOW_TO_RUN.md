# 🚀 كيفية تشغيل التطبيق

## ✅ الطريقة 1: من سطح المكتب (الأسهل)
1. ابحث عن أيقونة **ClassroomApp** على سطح المكتب
2. اضغط عليها مرتين
3. انتظر 10-30 ثانية (في أول مرة قد يستغرق وقت أطول)
4. ستفتح نافذة التطبيق تلقائياً! 🎉

---

## ⚡ الطريقة 2: من PowerShell/CMD
```bash
cd C:\Users\nabil\Projects\Classroom-Management-System
npm run electron:dev
```

---

## 🔧 إذا لم يعمل الاختصار:

### الحل 1: شغّل من المجلد مباشرة
1. افتح مجلد المشروع
2. اضغط مرتين على `launch-app.bat`

### الحل 2: استخدم Terminal
```powershell
cd C:\Users\nabil\Projects\Classroom-Management-System
npm run electron:dev
```

### الحل 3: أعد إنشاء الاختصار
```powershell
cd C:\Users\nabil\Projects\Classroom-Management-System
powershell -ExecutionPolicy Bypass -File "create-desktop-icon.ps1"
```

---

## 📝 ملاحظات مهمة

- **أول تشغيل** قد يستغرق 30-60 ثانية (يحمّل المكتبات)
- **التشغيل التالي** سيكون أسرع (5-15 ثانية)
- **نافذة CMD/PowerShell** قد تظهر لثوانٍ ثم تختفي - هذا طبيعي
- **التطبيق** سيفتح في نافذة Electron منفصلة

---

## 🎯 ما يحدث عند التشغيل

1. ✅ يبدأ Vite Development Server (Frontend)
2. ✅ يبدأ Backend Server (قاعدة البيانات والـ APIs)
3. ✅ ينتظر حتى يكون كل شيء جاهز
4. ✅ يفتح نافذة Electron مع التطبيق

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا شيء يحدث عند الضغط على الأيقونة
**الحل:**
```powershell
# تأكد أن npm مثبت
npm --version

# تأكد أن المشروع في المكان الصحيح
cd C:\Users\nabil\Projects\Classroom-Management-System
dir

# جرب التشغيل اليدوي
npm run electron:dev
```

### المشكلة: رسالة خطأ "npm not found"
**الحل:**
```powershell
# ثبّت Node.js من:
# https://nodejs.org/

# ثم ثبّت الحزم:
npm install
```

### المشكلة: النافذة تفتح وتغلق فوراً
**الحل:**
```powershell
# شغّل من Terminal لترى الأخطاء:
npm run electron:dev
```

---

## 📚 معلومات إضافية

- **منفذ Frontend:** http://localhost:5173
- **منفذ Backend:** http://localhost:3000
- **قاعدة البيانات:** classroom.db (في مجلد المشروع)

---

## 💡 نصيحة

احفظ هذا الأمر في Notepad للوصول السريع:
```
cd C:\Users\nabil\Projects\Classroom-Management-System && npm run electron:dev
```

---

**🎊 إذا نجح التشغيل، ستر نافذة التطبيق مع واجهة نظام إدارة الفصول!**
