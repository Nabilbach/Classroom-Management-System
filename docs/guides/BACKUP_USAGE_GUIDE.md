# 🚀 دليل الاستخدام السريع - نظام النسخ الاحتياطي

## ✅ التوصيات الفورية - تم التنفيذ

جميع التوصيات الفورية تم تنفيذها بنجاح:
- ✅ حماية قاعدة البيانات من Git
- ✅ إنشاء نسخة احتياطية فورية
- ✅ تشغيل خدمة النسخ التلقائية

**للتفاصيل الكاملة:** راجع `IMPLEMENTATION_REPORT.md`

---

## 🔧 الأوامر المفيدة

### عرض حالة النسخ الاحتياطية
```powershell
# آخر نسخة prestart
Get-ChildItem backups\prestart\ | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# آخر نسخة تلقائية
Get-ChildItem auto_backups\ | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# جميع النسخ الاحتياطية
Get-ChildItem -Path . -Filter "*.db" -Recurse | Sort-Object LastWriteTime -Descending | Select-Object FullName, Length, LastWriteTime -First 10
```

### إدارة خدمة النسخ التلقائية
```powershell
# التحقق من أن الخدمة تعمل
Get-Process node

# إيقاف خدمة النسخ (إذا لزم الأمر)
Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Stop-Process -Force

# إعادة تشغيل الخدمة
node smart_backup_service.cjs
```

### إنشاء نسخة احتياطية يدوية
```powershell
# نسخة سريعة قبل التشغيل
cd backend\scripts
node prestart_backup.js

# أو باستخدام npm
cd backend
npm run prestart-backup
```

### استعادة آمنة من نسخة احتياطية
```powershell
# استعادة آمنة (تتطلب --force)
cd backend
node emergency-restore.js --source ..\backups\prestart\classroom_prestart_YYYY-MM-DDTHH-MM-SS-SSSZ.db --force

# مراجعة ما سيتم فعله (بدون تطبيق)
node emergency-restore.js --source ..\path\to\backup.db
```

---

## 📊 فحص النظام

### التحقق من حماية Git
```powershell
# عرض القواعد المحمية
Get-Content .gitignore | Select-String "classroom|backup"
```

### التحقق من مساحة النسخ الاحتياطية
```powershell
# حجم جميع النسخ
Get-ChildItem -Path backups,auto_backups -Recurse -File | Measure-Object -Property Length -Sum | Select-Object Count, @{Name="Size(MB)";Expression={[math]::Round($_.Sum/1MB,2)}}
```

### فحص صحة قاعدة البيانات
```powershell
# إحصائيات القاعدة النشطة
cd backend\scripts
node get_db_stats.js
```

---

## 🔄 الصيانة الدورية

### يومياً:
- ✅ خدمة النسخ التلقائية تعمل تلقائياً (كل 6 ساعات)
- لا يوجد إجراء مطلوب منك

### أسبوعياً:
```powershell
# التحقق من النسخ الاحتياطية الحديثة
Get-ChildItem auto_backups\ | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

### شهرياً:
```powershell
# تنظيف النسخ القديمة جداً (أقدم من 30 يوم)
Get-ChildItem backups\prestart\ | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item -Force
```

---

## 🚨 في حالة الطوارئ

### فقدان بيانات:
```powershell
# 1. توقف فوراً
# لا تقم بأي تعديلات على القاعدة

# 2. اعرض النسخ المتاحة
Get-ChildItem -Path backups,auto_backups -Filter "*.db" -Recurse | Sort-Object LastWriteTime -Descending | Format-Table Name, LastWriteTime

# 3. استعد من أحدث نسخة آمنة
cd backend
node emergency-restore.js --source ..\backups\prestart\[اسم_النسخة].db --force
```

### تعطل خدمة النسخ التلقائية:
```powershell
# 1. إيقاف العمليات القديمة
Get-Process node | Stop-Process -Force

# 2. إعادة التشغيل
node smart_backup_service.cjs
```

---

## 📝 ملاحظات مهمة

1. **النسخة الاحتياطية الفورية:**
   - تُنشأ في: `backups/prestart/`
   - التسمية: `classroom_prestart_YYYY-MM-DDTHH-MM-SS-SSSZ.db`

2. **النسخ التلقائية:**
   - تُنشأ في: `auto_backups/`
   - التكرار: كل 6 ساعات
   - الاحتفاظ: آخر 10 نسخ

3. **الحماية من Git:**
   - جميع ملفات `.db` محمية
   - مجلدات النسخ الاحتياطية محمية
   - راجع `.gitignore` للتفاصيل

4. **سجل الاستعادة:**
   - الموقع: `backups/restore_audit.log`
   - يسجل جميع عمليات الاستعادة

---

## 📚 المراجع

- **BACKUP_SYSTEM_REPORT.md** - التقرير الشامل المفصل
- **BACKUP_SUMMARY_AR.md** - الملخص السريع بالعربية
- **IMPLEMENTATION_REPORT.md** - تقرير التنفيذ الفعلي
- **QUICK_IMPLEMENTATION_STEPS.md** - خطوات التنفيذ (إنجليزي)

---

## ✅ قائمة التحقق الدورية

استخدم هذه القائمة للتأكد من عمل النظام:

- [ ] خدمة النسخ التلقائية تعمل (`Get-Process node`)
- [ ] توجد نسخ حديثة في `auto_backups/` (خلال آخر 6 ساعات)
- [ ] توجد نسخ في `backups/prestart/`
- [ ] `.gitignore` يحمي `classroom.db`
- [ ] لا توجد أخطاء في السجلات

---

**آخر تحديث:** 2 أكتوبر 2025  
**الحالة:** نظام النسخ الاحتياطي نشط ويعمل ✅
