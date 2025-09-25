# 📖 دليل الاستخدام السريع - بيئات نظام إدارة الصفوف

## 🚀 البدء السريع

### للتطوير اليومي:
```bash
.\start-development.bat
```
↳ يفتح على: http://localhost:3001

### للاختبارات:
```bash
.\start-testing.bat
```
↳ يفتح على: http://localhost:3002

### للإنتاج (حذار!):
```bash
.\start-production.bat
```
↳ يفتح على: http://localhost:3000

---

## ⚠️ قواعد مهمة:

### ✅ افعل:
- استخدم بيئة التطوير للبرمجة
- اختبر على منافذ 3001 أو 3002
- تأكد من النسخ الاحتياطية قبل التحديثات الكبرى

### 🚫 لا تفعل:
- تستخدم منفذ 3000 للتطوير
- تعدل على `classroom.db` مباشرة
- تحذف مجلد `emergency_environment_backups`

---

## 🔧 استكشاف الأخطاء:

### المشكلة: "Port already in use"
**الحل**: تأكد من إيقاف العمليات الأخرى أولاً
```bash
.\stop-all-servers.ps1
```

### المشكلة: "Database locked"
**الحل**: أغلق جميع الاتصالات وأعد المحاولة

### المشكلة: بيانات مفقودة
**الحل**: استعد من النسخ الاحتياطية في `emergency_environment_backups/`

---

## 📊 معلومات البيئات:

| البيئة | المنفذ | قاعدة البيانات | الاستخدام |
|-------|-------|-------------|----------|
| الإنتاج | 3000 | classroom.db | البيانات الحقيقية |
| التطوير | 3001 | classroom_dev.db | التطوير والبرمجة |
| الاختبار | 3002 | classroom_test.db | اختبار الميزات |

---

## 🆘 في حالة الطوارئ:

### إذا فقدت البيانات:
```bash
# استعد النسخة الاحتياطية
copy "emergency_environment_backups\classroom_production_stable.db" "classroom.db"
```

### للتحقق من سلامة النظام:
```bash
node test_environment_separation.cjs
```

### للحصول على المساعدة:
راجع الملفات:
- `FINAL_ENVIRONMENT_SOLUTION_REPORT.md` - التقرير الشامل
- `COMPREHENSIVE_ENVIRONMENT_ANALYSIS_REPORT.md` - التحليل المفصل

---

## 📞 نصائح للاستخدام اليومي:

1. **ابدأ دائماً بالتطوير**: `start-development.bat`
2. **اختبر قبل النشر**: `start-testing.bat`
3. **انشر بحذر**: `start-production.bat`
4. **احفظ نسخاً احتياطية**: خاصة قبل التحديثات الكبرى

---

*لمزيد من التفاصيل، راجع `MISSION_ACCOMPLISHED.md`*