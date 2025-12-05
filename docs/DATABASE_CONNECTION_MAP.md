# 🗃️ خريطة ارتباطات قاعدة البيانات - تتبع تدفق البيانات الشامل

## 📋 الملخص التنفيذي

هذا التقرير يرصد **جميع نقاط الارتباط مع قواعد البيانات** في نظام إدارة الصفوف، من مصدر البيانات إلى وجهتها النهائية.

---

## 🎯 قواعد البيانات المكتشفة

### **القواعد الأساسية:**
```
📂 قواعد البيانات الرئيسية:
├── classroom.db (348 KB) ← الإنتاج الأساسية
├── classroom_dev.db (360 KB) ← التطوير 
├── classroom_test.db (360 KB) ← الاختبار
├── classroom_backup_20250924_174347.db ← نسخة احتياطية قديمة
└── classroom_backup_2.db (0 KB) ← تالف/فارغ
```

### **النسخ الاحتياطية:**
```
📂 emergency_environment_backups/:
├── classroom_production_stable.db (348 KB)
├── classroom_emergency_*.db (348 KB)
└── classroom_pre_fix_*.db (348 KB)

📂 auto_backups/:
└── auto_backup_*.db (متعدد)
```

---

## 🔗 مخطط تدفق البيانات

### **1. طبقة التكوين (Configuration Layer)**

#### **A. ملفات التكوين البيئية:**
```javascript
// .env.production
PORT=3000
NODE_ENV=production
DB_PATH=classroom.db ← 🎯 الإنتاج

// .env.development  
PORT=3001
NODE_ENV=development
DB_PATH=classroom_dev.db ← 🎯 التطوير

// .env.testing
PORT=3002
NODE_ENV=testing
DB_PATH=classroom_test.db ← 🎯 الاختبار
```

#### **B. تكوين قاعدة البيانات الرئيسية:**
```javascript
// backend/config/database.js
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', '..', 'classroom.db'), ← 🎯 مصدر ثابت
  logging: false,
  dialectOptions: { charset: 'utf8mb4' }
});
```

**⚠️ مشكلة**: التكوين الرئيسي يشير مباشرة إلى `classroom.db` بغض النظر عن البيئة!

---

### **2. طبقة النماذج (Models Layer)**

#### **النماذج المكتشفة:**
```javascript
// backend/models/index.js
const db = {
  sequelize, ← الاتصال الرئيسي
  Section,          // الأقسام
  Lesson,           // الدروس
  LessonTemplate,   // قوالب الدروس
  LessonLog,        // سجلات الدروس
  Student,          // الطلاب
  StudentAssessment,// تقييم الطلاب
  ScheduledLesson,  // الدروس المجدولة
  AdministrativeTimetableEntry, // الجدول الإداري
  AdminScheduleEntry, // إدخالات الجدول الإداري
  Attendance,       // الحضور
  TextbookEntry,    // إدخالات دفتر النصوص
};
```

#### **العلاقات (Associations):**
```javascript
Section ──┬─ hasMany ──> Lesson
          ├─ hasMany ──> LessonLog
          ├─ hasMany ──> Student
          └─ hasMany ──> Attendance

Student ──┬─ hasMany ──> StudentAssessment
          └─ hasMany ──> Attendance

Lesson ───┬─ hasMany ──> LessonLog
          └─ belongsTo ─> Section
```

---

### **3. طبقة الخدمات (Services Layer)**

#### **Backend Routes (مسارات الخادم):**
```javascript
📁 backend/routes/:
├── attendance.js ────────> جدول Attendance
├── adminSchedule.js ─────> جدول AdminScheduleEntry
├── lessons.js ───────────> جدول Lesson + LessonLog
├── lessonTemplates.js ───> جدول LessonTemplate
├── lessonTemplatesDB.js ─> جدول LessonTemplate (DB مباشر)
├── scheduledLessons.js ──> جدول ScheduledLesson
├── sectionStats.js ──────> إحصائيات من جداول متعددة
└── textbook.js ──────────> جدول TextbookEntry
```

#### **Frontend API Services:**
```typescript
📁 src/services/api/:
├── apiClient.ts ─────────> عميل API أساسي (يشير إلى localhost:3000)
├── attendanceService.ts ─> خدمة الحضور
├── lessonTemplateService.ts > خدمة قوالب الدروس
├── lessonTemplateServiceDB.ts > خدمة DB مباشرة (localhost:5000/5001)
├── lessonLogService.ts ──> خدمة سجلات الدروس
├── sectionService.ts ────> خدمة الأقسام
├── scheduledLessonService.ts > خدمة الدروس المجدولة
├── adminScheduleService.ts > خدمة الجدول الإداري
├── curriculumService.ts ─> خدمة المنهج
└── gradeService.ts ──────> خدمة الدرجات
```

---

### **4. طبقة واجهة المستخدم (UI Layer)**

#### **مكونات التطبيق:**
```
📁 src/components/ + src/pages/:
├── AttendanceManagement ─> attendanceService → Attendance
├── LessonTemplates ──────> lessonTemplateService → LessonTemplate
├── ScheduledLessons ─────> scheduledLessonService → ScheduledLesson
├── StudentManagement ────> sectionService → Student + Section
├── TextbookManagement ───> textbookService → TextbookEntry
├── AdminSchedule ────────> adminScheduleService → AdminScheduleEntry
└── Dashboard ────────────> multiple services → إحصائيات شاملة
```

---

## 🔄 مسارات تدفق البيانات التفصيلية

### **مسار 1: إدارة الحضور**
```
Frontend Component (AttendanceManagement)
    ↓ HTTP Requests
Frontend Service (attendanceService.ts)
    ↓ API calls (localhost:3000)
Backend Route (/api/attendance)
    ↓ Sequelize ORM
Database Model (Attendance)
    ↓ SQL Queries
SQLite Database (classroom.db)
```

### **مسار 2: قوالب الدروس**
```
Frontend Component (LessonTemplates)
    ↓ HTTP Requests
Frontend Service (lessonTemplateService.ts)
    ↓ API calls (localhost:3000)
Backend Route (/api/lesson-templates)
    ↓ Sequelize ORM
Database Model (LessonTemplate)
    ↓ SQL Queries
SQLite Database (classroom.db)
```

### **مسار 3: قوالب الدروس المباشرة**
```
Frontend Component (LessonTemplates)
    ↓ HTTP Requests
Frontend Service (lessonTemplateServiceDB.ts)
    ↓ API calls (localhost:5000/5001) ← ⚠️ منفذ مختلف!
Backend Service (مجهول/مفقود)
    ↓ Direct DB Connection
SQLite Database (classroom.db)
```

**⚠️ مشكلة**: يوجد خدمة مباشرة تتصل بمنافذ مختلفة (5000/5001)!

### **مسار 4: الجدول الإداري**
```
Frontend Component (AdminSchedule)
    ↓ HTTP Requests
Frontend Service (adminScheduleService.ts)
    ↓ API calls (localhost:3000)
Backend Route (/api/admin-schedule)
    ↓ Sequelize ORM
Database Model (AdminScheduleEntry)
    ↓ SQL Queries
SQLite Database (classroom.db)
```

### **مسار 5: دفتر النصوص**
```
Frontend Component (TextbookManagement)
    ↓ HTTP Requests
Frontend Service (textbookService.ts)
    ↓ API calls (localhost:3000)
Backend Route (/api/textbook)
    ↓ Sequelize ORM
Database Model (TextbookEntry)
    ↓ SQL Queries
SQLite Database (classroom.db)
```

---

## 🔍 نقاط الاتصال المباشر بقاعدة البيانات

### **1. سكريبتات التحليل والصيانة:**
```javascript
// ملفات تتصل مباشرة بـ SQLite دون ORM
const sqlite3 = require('sqlite3').verbose();

📁 الجذر الرئيسي:
├── check_attendance.cjs ────> classroom.db (قراءة)
├── detailed_attendance_check.cjs > classroom.db (قراءة)
├── check_learning_data.cjs ─> classroom.db (قراءة)
├── create_lesson_templates_table.cjs > classroom.db (كتابة)
├── check_lesson_tables.cjs ─> classroom.db (قراءة)
├── search_missing_lessons.cjs > classroom.db + backup.db (قراءة)
├── restore_lessons_*.cjs ──> classroom.db (كتابة) + backup.db (قراءة)
├── investigate_*.cjs ──────> classroom.db + backup.db (قراءة)
├── final_*.cjs ────────────> classroom.db (كتابة/قراءة)
└── comprehensive_*.cjs ────> classroom.db + backup.db (قراءة/كتابة)

📁 backend/:
├── check_evaluation_tables.js > classroom.db (قراءة)
├── inspect_db.js ──────────> classroom.db (قراءة)
├── reset_db.js ────────────> classroom.db (كتابة)
└── migrate.js ─────────────> classroom.db (كتابة)
```

### **2. نظم النسخ الاحتياطي:**
```javascript
📁 أنظمة النسخ الاحتياطي:
├── emergency_environment_fixer_*.cjs > classroom.db → نسخ متعددة
├── comprehensive_data_protection_system.cjs > حماية شاملة
├── smart_backup_service.cjs > نسخ احتياطية ذكية
├── database_hardening.cjs ─> تقوية أمان قاعدة البيانات
└── monitoring_service.cjs ─> مراقبة مستمرة
```

### **3. أنظمة المراقبة:**
```javascript
📁 أنظمة المراقبة:
├── data_integrity_monitor.cjs > فحص سلامة البيانات
├── system_wide_data_loss_investigator.cjs > تحقيق فقدان البيانات
├── calendar_textbook_sync_monitor.cjs > مزامنة التقويم
└── environment_analysis_report.cjs > تحليل البيئات
```

---

## ⚠️ نقاط المخاطر المكتشفة

### **1. تضارب التكوين:**
```
❌ التكوين الثابت في database.js يشير دائماً إلى classroom.db
❌ متغيرات البيئة لا تؤثر على backend/config/database.js
❌ خدمة lessonTemplateServiceDB تستخدم منافذ مختلفة (5000/5001)
```

### **2. اتصالات مباشرة متعددة:**
```
❌ 50+ ملف يتصل مباشرة بـ SQLite دون تنسيق
❌ بعض السكريبتات تكتب في قاعدة الإنتاج مباشرة
❌ عدم وجود آلية موحدة للوصول لقاعدة البيانات
```

### **3. مخاطر فقدان البيانات:**
```
❌ عمليات الكتابة غير المحمية بـ transactions
❌ تداخل العمليات بين التطوير والإنتاج
❌ عدم وجود قفل (locking) على قاعدة البيانات
```

---

## 🛡️ الحلول المطلوبة

### **1. توحيد التكوين:**
```javascript
// إصلاح backend/config/database.js
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '..', '..', 'classroom.db'),
  // باقي الإعدادات...
});
```

### **2. إنشاء مدير اتصال موحد:**
```javascript
// utils/databaseManager.js
class DatabaseManager {
  static getInstance(environment = 'production') {
    const dbPaths = {
      production: 'classroom.db',
      development: 'classroom_dev.db', 
      testing: 'classroom_test.db'
    };
    return new sqlite3.Database(dbPaths[environment]);
  }
}
```

### **3. إضافة حماية المعاملات:**
```javascript
// في جميع عمليات الكتابة
db.serialize(() => {
  db.run("BEGIN TRANSACTION");
  // العمليات...
  db.run("COMMIT");
});
```

---

## 📊 إحصائيات الاتصال

```
📈 تقرير شامل:
├── 📁 قواعد البيانات: 8 قواعد مكتشفة
├── 🔗 ملفات الاتصال المباشر: 50+ ملف
├── 🌐 خدمات API: 10 خدمات
├── 📱 مكونات UI: 15+ مكون
├── ⚙️ نماذج البيانات: 12 نموذج
├── 🛣️ مسارات API: 8 مسارات
├── 🔧 سكريبتات الصيانة: 30+ سكريبت
└── 💾 أنظمة النسخ الاحتياطي: 5 أنظمة
```

---

## 🎯 الخلاصة والتوصيات

### **المشاكل الرئيسية:**
1. **عدم توحيد الوصول**: اتصالات متعددة ومتضاربة
2. **تضارب التكوين**: إعدادات ثابتة لا تتبع البيئات
3. **مخاطر أمنية**: كتابة مباشرة دون حماية
4. **صعوبة التتبع**: مسارات معقدة ومتداخلة

### **الحلول المطلوبة:**
1. **توحيد مدير قاعدة البيانات** لجميع الاتصالات
2. **إصلاح التكوين** ليدعم متغيرات البيئة
3. **إضافة طبقة حماية** للمعاملات والأمان
4. **توثيق المسارات** وتبسيط التدفق

### **الأولوية العاجلة:**
1. 🚨 إصلاح `backend/config/database.js` ليدعم متغيرات البيئة
2. 🚨 توحيد جميع الاتصالات المباشرة تحت مدير واحد  
3. 🚨 إضافة حماية transactions لجميع عمليات الكتابة
4. 🚨 إنشاء نظام monitoring موحد لتتبع الاتصالات

**النتيجة**: نظام معقد جداً يحتاج إلى إعادة هيكلة شاملة لضمان الأمان والاستقرار! 🔧

---

*تاريخ التقرير: 25 سبتمبر 2025*
*مستوى التعقيد: عالي جداً 🔴*
*الحاجة للإصلاح: عاجل جداً ⚡*