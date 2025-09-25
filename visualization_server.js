import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// تقديم الملفات الثابتة
app.use(express.static(__dirname));

// تقديم صفحة المخطط الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'interactive_database_visualization.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 المخطط المرئي التفاعلي متاح على:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`\n📊 إحصائيات النظام:`);
    console.log(`   • 150 نقطة اتصال مع قاعدة البيانات`);
    console.log(`   • 5 قواعد بيانات مختلفة`);
    console.log(`   • 63 اتصال مباشر`);
    console.log(`   • 3 مخاطر حرجة`);
    console.log(`\n🎯 التحكم التفاعلي:`);
    console.log(`   • انقر على العقد لعرض التفاصيل`);
    console.log(`   • استخدم أزرار التحكم للتصفية`);
    console.log(`   • اسحب العقد لإعادة ترتيب المخطط`);
    console.log(`\n⚠️  لإيقاف الخادم: اضغط Ctrl+C`);
});