# تحديث الأيقونات - دليل سريع

## الملفات الموجودة

- `ClassroomAppicon.png` - الأيقونة الأصلية
- `build/icon.ico` - للاستخدام في Windows (Electron & Shortcuts)
- `build/icon.png` - نسخة PNG

## أين تظهر الأيقونة؟

### 1. في شريط المهام (Taskbar)
- يجب أن تظهر عند تشغيل التطبيق
- تأخذها من `electron/main.cjs` → `icon` property

### 2. في الشورتكات على سطح المكتب
- تأخذها من `IconLocation` في ملف الشورتكات
- المسار: `build/icon.ico`

### 3. في Alt+Tab
- نفس الأيقونة من Electron window

## إذا لم تظهر الأيقونة

### الحل 1: مسح ذاكرة الأيقونات المؤقتة
```bash
.\clear-icon-cache.bat
```

### الحل 2: إعادة إنشاء الشورتكات
```powershell
Remove-Item "$env:USERPROFILE\Desktop\Classroom Desktop App.lnk" -Force
.\CREATE-FINAL-DESKTOP-SHORTCUT.ps1
```

### الحل 3: إعادة تشغيل التطبيق
1. أغلق التطبيق تماماً
2. شغّل `STOP-DESKTOP-APP.bat`
3. افتح التطبيق مرة أخرى

### الحل 4: تحويل الأيقونة مرة أخرى
إذا كانت الأيقونة تالفة:
```powershell
.\convert-icon.ps1
```

## تحديث الأيقونة

إذا أردت تغيير الأيقونة:

1. **ضع ملف PNG جديد** في مجلد المشروع
2. **شغّل:**
```powershell
.\convert-icon.ps1
```
3. **حدّث الشورتكات:**
```powershell
.\CREATE-FINAL-DESKTOP-SHORTCUT.ps1
```
4. **امسح الذاكرة المؤقتة:**
```powershell
.\clear-icon-cache.bat
```

## التحقق

للتأكد من أن الأيقونة تعمل:

```powershell
# تحقق من وجود الملفات
Test-Path "build\icon.ico"
Test-Path "build\icon.png"

# تحقق من حجم الملفات (يجب أن لا يكون 0)
Get-ChildItem build\icon.* | Select Name, Length
```

## ملاحظات

- الأيقونة في Electron تحتاج إعادة تشغيل التطبيق لتظهر
- الأيقونة في الشورتكات قد تحتاج مسح الذاكرة المؤقتة
- على Windows، استخدم دائماً `.ico` للأفضل توافق
