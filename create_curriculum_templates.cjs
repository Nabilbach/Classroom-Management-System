const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('=== إنشاء قوالب الدروس من المنهج ===');

const db = new sqlite3.Database('classroom.db');

// قراءة ملف المنهج
const csv = fs.readFileSync('مقرر مادة التربية الإسلامية للجذع مشترك.csv', 'utf8');
const lines = csv.split('\n');
const lessons = [];

// تحليل ملف CSV
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line) {
    const [week, title] = line.split(',');
    if (week && title && !title.includes('تقويم') && !title.includes('أنشطة') && !title.includes('إجراءات')) {
      lessons.push({
        week: week.trim(),
        title: title.trim()
      });
    }
  }
}

console.log(`تم العثور على ${lessons.length} درس في المنهج`);

// إنشاء قوالب الدروس
const insertStmt = db.prepare(`
  INSERT INTO LessonTemplates (
    id, title, subject, grade, duration, objectives, content, 
    stages, resources, assessment, homework, notes, createdAt, 
    updatedAt, description, estimatedSessions, courseName, 
    level, weekNumber, scheduledSections
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let insertCount = 0;

lessons.forEach((lesson, index) => {
  const id = `tpl-${String(index + 1).padStart(3, '0')}`;
  const now = new Date().toISOString();
  
  // تحديد الأهداف والمحتوى بناءً على نوع الدرس
  let objectives, content, stages, resources, assessment;
  
  if (lesson.title.includes('سورة')) {
    objectives = JSON.stringify([
      "حفظ وتلاوة آيات من السورة",
      "فهم المعاني والتفسير",
      "استخراج العبر والدروس"
    ]);
    content = `تلاوة وحفظ وتفسير ${lesson.title}`;
    stages = JSON.stringify([
      "التلاوة النموذجية",
      "التلاوة الجماعية",
      "الحفظ التدريجي",
      "شرح المعاني",
      "استخراج الدروس"
    ]);
    resources = JSON.stringify([
      "المصحف الشريف",
      "كتب التفسير",
      "التسجيلات الصوتية"
    ]);
  } else if (lesson.title.includes('فقه')) {
    objectives = JSON.stringify([
      "فهم الأحكام الشرعية",
      "تطبيق المعرفة في الحياة",
      "معرفة الأدلة والحكم"
    ]);
    content = `دراسة أحكام وتطبيقات ${lesson.title}`;
    stages = JSON.stringify([
      "تقديم الموضوع",
      "شرح الأحكام",
      "ذكر الأدلة",
      "أمثلة تطبيقية",
      "أسئلة ونقاش"
    ]);
    resources = JSON.stringify([
      "كتب الفقه",
      "الأدلة الشرعية",
      "أمثلة من الواقع"
    ]);
  } else if (lesson.title.includes('حق')) {
    objectives = JSON.stringify([
      "فهم الحقوق والواجبات",
      "تنمية السلوك الأخلاقي",
      "تطبيق القيم الإسلامية"
    ]);
    content = `دراسة ${lesson.title} وتطبيقاته`;
    stages = JSON.stringify([
      "تعريف المفهوم",
      "الأدلة الشرعية",
      "النماذج التطبيقية",
      "الممارسة العملية",
      "التقويم الذاتي"
    ]);
    resources = JSON.stringify([
      "القرآن والسنة",
      "قصص وأمثلة",
      "أنشطة تطبيقية"
    ]);
  } else {
    objectives = JSON.stringify([
      "فهم المفاهيم الأساسية",
      "ربط الموضوع بالحياة",
      "تعزيز الإيمان والتقوى"
    ]);
    content = `دراسة موضوع ${lesson.title}`;
    stages = JSON.stringify([
      "التمهيد",
      "العرض والشرح",
      "المناقشة والحوار",
      "الأنشطة التطبيقية",
      "الخلاصة والتقويم"
    ]);
    resources = JSON.stringify([
      "المراجع الأساسية",
      "وسائل إيضاح",
      "أنشطة متنوعة"
    ]);
  }
  
  assessment = JSON.stringify([
    "تقويم تكويني أثناء الدرس",
    "أسئلة شفهية ومكتوبة",
    "أنشطة تطبيقية",
    "تقويم ختامي"
  ]);
  
  insertStmt.run([
    id, lesson.title, 'التربية الإسلامية', 'الجذع المشترك', 50,
    objectives, content, stages, resources, assessment,
    'مراجعة وحفظ', `قالب للدرس: ${lesson.title}`, now, now,
    `درس من منهج التربية الإسلامية للجذع المشترك - الأسبوع ${lesson.week}`,
    1, 'التربية الإسلامية', 'الجذع المشترك', parseInt(lesson.week), ''
  ], (err) => {
    if (err) {
      console.log(`خطأ في إنشاء ${lesson.title}:`, err.message);
    } else {
      insertCount++;
      console.log(`تم إنشاء: ${lesson.title} (الأسبوع ${lesson.week})`);
    }
    
    if (insertCount === lessons.length) {
      insertStmt.finalize();
      console.log(`\n=== تم إنشاء ${insertCount} قالب درس بنجاح ===`);
      
      // فحص النتيجة النهائية
      db.all('SELECT COUNT(*) as count FROM LessonTemplates', (err, rows) => {
        if (err) {
          console.log('خطأ في فحص النتيجة:', err.message);
        } else {
          console.log('إجمالي قوالب الدروس الآن:', rows[0].count);
        }
        
        db.close();
        console.log('=== انتهت عملية إنشاء القوالب ===');
      });
    }
  });
});