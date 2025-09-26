# 🔗 دليل إعداد تكامل ClickUp API

## 📋 المتطلبات:

### 1. الحصول على API Token:
1. اذهب إلى ClickUp Settings
2. اضغط على "Apps" 
3. اضغط على "API"
4. انسخ "Personal API Token"

### 2. الحصول على معرفات المشروع:
```bash
# احصل على معرف الفريق
curl -H "Authorization: YOUR_TOKEN" https://api.clickup.com/api/v2/team

# احصل على معرف المساحة  
curl -H "Authorization: YOUR_TOKEN" https://api.clickup.com/api/v2/team/TEAM_ID/space

# احصل على معرف القائمة
curl -H "Authorization: YOUR_TOKEN" https://api.clickup.com/api/v2/space/SPACE_ID/list
```

## 🔧 خطوات التفعيل:

### 1. تحديث ملف الإعدادات:
```javascript
const CLICKUP_CONFIG = {
  API_TOKEN: 'pk_YOUR_ACTUAL_TOKEN_HERE',
  TEAM_ID: '1234567',
  SPACE_ID: '7654321', 
  LIST_ID: '9876543'
};
```

### 2. تشغيل المزامنة:
```bash
node clickup_api_integration.cjs
```

### 3. تفعيل المزامنة التلقائية:
```bash
node clickup_api_integration.cjs --auto-sync
```

## ⚡ الميزات:
- ✅ إنشاء مهام جديدة تلقائياً
- 🔄 تحديث حالة المهام الموجودة  
- 📊 مزامنة نسب التقدم
- 🏷️ إضافة تاغز وأولويات
- ⏰ مزامنة تلقائية كل ساعة

## 🚨 ملاحظات الأمان:
- لا تشارك API Token مع أحد
- احفظ النسخة الاحتياطية من الإعدادات
- استخدم متغيرات البيئة للإنتاج

---
*تم إنشاء هذا الدليل تلقائياً* 📖
