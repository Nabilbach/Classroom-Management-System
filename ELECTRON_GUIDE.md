# 🖥️ دليل تطبيق سطح المكتب - Electron Desktop App Guide

## 📋 نظرة عامة

تم إعداد التطبيق للعمل كتطبيق سطح مكتب مستقل باستخدام Electron. يتضمن التطبيق:
- واجهة مستخدم React كاملة
- خادم Backend مدمج
- قاعدة بيانات SQLite محلية
- قوائم عربية وواجهة محسّنة

---

## 🚀 الاستخدام

### **1. وضع التطوير (Development Mode)**
```bash
npm run electron:dev
```
- يشغل Vite dev server على المنفذ 5173
- يفتح نافذة Electron تتصل بـ localhost
- يدعم Hot Module Replacement (HMR)
- DevTools مفتوح للتصحيح
- **مثالي للتطوير اليومي** ⚡

### **2. بناء التطبيق (Build)**
```bash
npm run electron:build
```
- يبني Frontend باستخدام Vite
- يحزّم التطبيق باستخدام electron-builder
- ينتج ملفات تثبيت جاهزة في مجلد `release/`

---

## 📦 أنواع الملفات الناتجة

### **Windows:**
1. **NSIS Installer** (موصى به للتوزيع)
   - `Classroom Management System-2.1.0-x64.exe`
   - مثبّت كامل مع إلغاء تثبيت
   - يسمح للمستخدم باختيار مجلد التثبيت
   - ينشئ اختصارات سطح المكتب وقائمة البدء

2. **Portable Version** (نسخة محمولة)
   - `Classroom Management System-2.1.0-Portable.exe`
   - لا تحتاج تثبيت
   - يمكن تشغيلها من USB

### **Linux:**
- AppImage (ملف واحد قابل للتشغيل)
- .deb (لتوزيعات Debian/Ubuntu)

### **macOS:**
- .dmg (صورة قرص للتثبيت)
- .zip (أرشيف مضغوط)

---

## ⚙️ الميزات المضافة

### **1. قائمة التطبيق العربية** 📋
- **ملف:** إعادة تحميل، خروج
- **عرض:** تكبير/تصغير، شاشة كاملة
- **مساعدة:** حول التطبيق

### **2. اختصارات لوحة المفاتيح** ⌨️
- `Ctrl+R` - إعادة تحميل
- `Ctrl+Q` - خروج
- `Ctrl+Plus` - تكبير
- `Ctrl+-` - تصغير
- `Ctrl+0` - حجم افتراضي
- `F11` - شاشة كاملة
- `Ctrl+Shift+I` - أدوات المطور (في وضع التطوير)

### **3. تحسينات النافذة** 🪟
- حجم افتراضي: 1400x900
- حد أدنى: 1024x768
- لا يظهر flash عند التشغيل
- عنوان عربي: "نظام إدارة الفصول الدراسية"

---

## 🔧 التكوين

### **ملف package.json - قسم build:**
```json
{
  "build": {
    "appId": "com.nabilbach.classroom-management",
    "productName": "Classroom Management System",
    "files": ["dist/**/*", "electron/**/*", "backend/**/*"],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "build/icon.ico"
    }
  }
}
```

### **الأيقونات:**
- Windows: `build/icon.ico` (256x256 موصى به)
- macOS: `build/icon.icns` (512x512@2x موصى به)
- Linux: `build/icons/` (مجموعة أحجام PNG)

---

## 📁 هيكل الملفات

```
Classroom-Management-System/
├── electron/
│   ├── main.cjs          # العملية الرئيسية لـ Electron
│   └── preload.cjs       # سكريبت الأمان
├── build/
│   ├── icon.ico          # أيقونة Windows
│   └── icons/            # أيقونات Linux
├── dist/                 # ملفات Frontend المبنية
├── backend/              # خادم Node.js
├── classroom.db          # قاعدة البيانات
├── LICENSE.txt           # رخصة التطبيق
└── release/              # ملفات التطبيق النهائية (بعد البناء)
```

---

## 🎯 سير العمل الموصى به

1. **التطوير اليومي:**
   ```bash
   npm run dev
   ```
   أسرع للتطوير السريع في المتصفح

2. **اختبار في Electron:**
   ```bash
   npm run electron:dev
   ```
   لاختبار الميزات الخاصة بسطح المكتب

3. **بناء للتوزيع:**
   ```bash
   npm run electron:build
   ```
   عند الاستعداد للنشر أو التوزيع

---

## 🔐 الأمان

- ✅ `contextIsolation: true` - عزل السياق
- ✅ `nodeIntegration: false` - تعطيل Node في الواجهة
- ✅ `webSecurity: true` - أمان الويب مفعّل
- ✅ استخدام preload.cjs للوصول الآمن للـ APIs

---

## 📝 ملاحظات مهمة

1. **قاعدة البيانات:**
   - يتم تضمين `classroom.db` مع التطبيق
   - في أول تشغيل، تأكد من وجود البيانات الأولية

2. **الخادم الخلفي:**
   - يبدأ تلقائياً مع التطبيق
   - يعمل على المنفذ 3000
   - يتوقف عند إغلاق التطبيق

3. **التحديثات:**
   - يمكن إضافة auto-updater لاحقاً
   - حالياً يحتاج تحديث يدوي

4. **حجم التطبيق:**
   - متوقع ~200-300 MB بعد التحزيم
   - يتضمن Node.js و Chromium

---

## 🐛 استكشاف الأخطاء

### **المشكلة: التطبيق لا يفتح**
```bash
# تحقق من السجلات
npm run electron:dev
# راقب رسائل الخطأ في Console
```

### **المشكلة: Backend لا يعمل**
```bash
# تحقق من المنفذ 3000
netstat -ano | findstr :3000
```

### **المشكلة: قاعدة البيانات مفقودة**
```bash
# تأكد من وجود classroom.db
dir classroom.db
```

---

## 🎨 التخصيص

### **تغيير الأيقونة:**
1. استبدل `build/icon.ico` بأيقونتك (256x256)
2. أعد البناء: `npm run electron:build`

### **تغيير القوائم:**
1. عدّل `electron/main.cjs` → دالة `createMenu()`
2. أعد تشغيل في وضع التطوير

### **تغيير حجم النافذة:**
1. عدّل `electron/main.cjs` → دالة `createWindow()`
2. غيّر `width` و `height`

---

## 📊 الحالة الحالية

✅ **مكتمل:**
- [x] إعداد Electron الأساسي
- [x] تكامل Backend
- [x] قوائم عربية
- [x] اختصارات لوحة مفاتيح
- [x] تكوين electron-builder
- [x] أيقونة التطبيق
- [x] ملف الترخيص

🔄 **قيد التطوير:**
- [ ] Auto-updater (التحديثات التلقائية)
- [ ] Notification system (نظام الإشعارات)
- [ ] System tray integration (أيقونة في شريط المهام)

---

## 📞 الدعم

للمزيد من المعلومات:
- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)

---

**🎉 التطبيق جاهز للبناء والتوزيع!**
