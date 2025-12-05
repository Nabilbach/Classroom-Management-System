# خطوات التنفيذ اليدوية السريعة
# Quick Manual Implementation Steps

## تم إعداد الملفات التالية:

### 1. التقرير الشامل
`BACKUP_SYSTEM_REPORT.md` - تقرير مفصل عن نظام النسخ الاحتياطي وحالة البيانات

### 2. السكريبتات الجاهزة
- ✅ `backend/emergency-restore.js` - تم تأمينه وتحسينه
- ✅ `backend/scripts/prestart_backup.js` - نسخة احتياطية قبل التشغيل
- ✅ `backend/scripts/compare_schedule_exports.js` - مقارنة النسخ
- ✅ `backend/scripts/get_db_stats.js` - إحصائيات قاعدة البيانات
- ✅ `quick_setup.ps1` - سكريبت إعداد سريع

---

## الخطوات المطلوبة الآن (نفذها يدوياً):

### الخطوة 1: حماية قاعدة البيانات من Git
افتح ملف `.gitignore` في المجلد الرئيسي وأضف:
```
classroom.db
classroom_*.db
backups/
auto_backups/
*.db-journal
*.db-shm
*.db-wal
```

### الخطوة 2: إنشاء نسخة احتياطية فورية
افتح PowerShell في مجلد backend/scripts ونفذ:
```powershell
node prestart_backup.js
```

### الخطوة 3: تشغيل خدمة النسخ الاحتياطية التلقائية
في مجلد المشروع الرئيسي:
```powershell
node smart_backup_service.cjs
```
(اتركها تعمل في نافذة منفصلة)

### الخطوة 4: تحديث package.json (اختياري)
في `backend/package.json`، غيّر السكريبتات إلى:
```json
{
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "prestart-backup": "node ./scripts/prestart_backup.js",
    "safe-restore": "node ./emergency-restore.js",
    "start": "node ./scripts/prestart_backup.js && node index.js"
  }
}
```

---

## الاستخدام المستقبلي:

### لتشغيل الخادم مع نسخة احتياطية تلقائية:
```powershell
cd backend
npm run prestart-backup
npm start
```

### لعمل استعادة آمنة:
```powershell
cd backend
node emergency-restore.js --source ../path/to/backup.db --force
```

### لفحص حالة النسخ الاحتياطية:
```powershell
node backend/scripts/scan_all_backups.js
```

---

## ملاحظات مهمة:

1. **النسخ الاحتياطية الحالية:**
   - جميع النسخ تحتوي على بيانات AdminScheduleEntries حتى تاريخ 21 سبتمبر فقط
   - أي تعديلات بعد هذا التاريخ مفقودة ولا يمكن استرجاعها

2. **الحماية المستقبلية:**
   - تم تأمين emergency-restore.js ليتطلب علم --force صريح
   - يتم إنشاء snapshot تلقائي قبل أي استعادة في: backups/automatic_snapshots/
   - سجل تدقيق متاح في: backups/restore_audit.log

3. **خدمة النسخ التلقائية:**
   - تعمل كل 6 ساعات
   - تحتفظ بآخر 10 نسخ
   - تحفظ في مجلد: auto_backups/

---

## للمزيد من التفاصيل:
راجع الملف: `BACKUP_SYSTEM_REPORT.md`
