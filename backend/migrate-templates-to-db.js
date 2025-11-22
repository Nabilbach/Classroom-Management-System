const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 بدء استيراد قوالب الدروس إلى قاعدة البيانات...');
console.log('📁 مسار قاعدة البيانات:', dbPath);
console.log('');

// التحقق من وجود جدول LessonTemplates
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='LessonTemplates'", (err, row) => {
  if (err) {
    console.error('❌ خطأ:', err);
    return;
  }
  
  if (!row) {
    console.log('⚠️ جدول LessonTemplates غير موجود. جاري إنشاؤه...');
    createTable();
  } else {
    console.log('✅ جدول LessonTemplates موجود\n');
    checkAndImport();
  }
});

function createTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS LessonTemplates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      duration INTEGER DEFAULT 50,
      objectives TEXT,
      content TEXT,
      stages TEXT,
      resources TEXT,
      assessment TEXT,
      homework TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `;
  
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ خطأ في إنشاء الجدول:', err);
      return;
    }
    console.log('✅ تم إنشاء جدول LessonTemplates\n');
    checkAndImport();
  });
}

function checkAndImport() {
  // التحقق من عدد القوالب الحالية
  db.get("SELECT COUNT(*) as count FROM LessonTemplates", (err, row) => {
    if (err) {
      console.error('❌ خطأ في عد القوالب:', err);
      return;
    }
    
    console.log(`📊 عدد القوالب الحالية في قاعدة البيانات: ${row.count}\n`);
    
    if (row.count > 0) {
      console.log('✅ توجد قوالب في قاعدة البيانات');
      console.log('💡 إذا كنت تريد استيراد قوالب جديدة، يمكنك استخدام الدالة importTemplates\n');
      db.close();
      return;
    }
    
    console.log('⚠️ قاعدة البيانات فارغة. جاري استيراد القوالب الافتراضية...\n');
    importDefaultTemplates();
  });
}

function importDefaultTemplates() {
  // قوالب افتراضية للتربية الإسلامية - الجذع المشترك
  const defaultTemplates = [
    {
      id: 'tpl-islamic-1',
      title: 'الإيمان بالغيب',
      subject: 'التربية الإسلامية',
      grade: 'الجذع المشترك',
      duration: 50,
      objectives: JSON.stringify(['فهم مفهوم الغيب في الإسلام', 'معرفة أنواع الغيب', 'تعزيز الإيمان بالغيب']),
      content: 'درس عن الإيمان بالغيب وأهميته في العقيدة الإسلامية',
      stages: JSON.stringify([
        { id: 's1', title: 'تمهيد', duration: 10, isCompleted: false },
        { id: 's2', title: 'عرض المفهوم', duration: 25, isCompleted: false },
        { id: 's3', title: 'تطبيقات عملية', duration: 10, isCompleted: false },
        { id: 's4', title: 'تقويم', duration: 5, isCompleted: false }
      ]),
      resources: JSON.stringify(['القرآن الكريم', 'السنة النبوية', 'كتاب العقيدة']),
      assessment: JSON.stringify({}),
      homework: JSON.stringify({}),
      notes: ''
    },
    {
      id: 'tpl-islamic-2',
      title: 'الإيمان بالملائكة',
      subject: 'التربية الإسلامية',
      grade: 'الجذع المشترك',
      duration: 50,
      objectives: JSON.stringify(['معرفة حقيقة الملائكة', 'التعرف على وظائف الملائكة', 'تعزيز الإيمان بالملائكة']),
      content: 'درس عن الإيمان بالملائكة وصفاتهم ووظائفهم',
      stages: JSON.stringify([
        { id: 's1', title: 'تمهيد', duration: 10, isCompleted: false },
        { id: 's2', title: 'عرض', duration: 25, isCompleted: false },
        { id: 's3', title: 'أنشطة', duration: 10, isCompleted: false },
        { id: 's4', title: 'تقويم', duration: 5, isCompleted: false }
      ]),
      resources: JSON.stringify(['القرآن الكريم', 'أحاديث نبوية']),
      assessment: JSON.stringify({}),
      homework: JSON.stringify({}),
      notes: ''
    }
  ];
  
  let imported = 0;
  let errors = 0;
  
  const insertPromises = defaultTemplates.map(template => {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO LessonTemplates (
          id, title, subject, grade, duration, objectives, content,
          stages, resources, assessment, homework, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        template.id, template.title, template.subject, template.grade,
        template.duration, template.objectives, template.content,
        template.stages, template.resources, template.assessment,
        template.homework, template.notes
      ], (err) => {
        if (err) {
          console.error(`❌ فشل استيراد: ${template.title}`, err.message);
          errors++;
          reject(err);
        } else {
          console.log(`✅ تم استيراد: ${template.title}`);
          imported++;
          resolve();
        }
      });
    });
  });
  
  Promise.allSettled(insertPromises).then(() => {
    console.log(`\n📊 النتائج النهائية:`);
    console.log(`   ✅ تم استيراد: ${imported} قالب`);
    console.log(`   ❌ فشل: ${errors} قالب\n`);
    
    if (imported > 0) {
      console.log('🎉 تم استيراد القوالب الافتراضية بنجاح!');
      console.log('💡 يمكنك الآن إضافة المزيد من القوالب من خلال التطبيق\n');
    }
    
    db.close();
  });
}

// دالة لاستيراد قوالب من ملف JSON (اختياري)
function importFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const templates = JSON.parse(data);
    
    console.log(`📥 جاري استيراد ${templates.length} قالب من ${filePath}...\n`);
    
    let imported = 0;
    let errors = 0;
    
    templates.forEach(template => {
      const id = template.id || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      
      db.run(`
        INSERT OR REPLACE INTO LessonTemplates (
          id, title, subject, grade, duration, objectives, content,
          stages, resources, assessment, homework, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        template.title,
        template.subject || template.courseName,
        template.grade || template.level,
        template.duration || 50,
        JSON.stringify(template.objectives || []),
        template.content || template.description || '',
        JSON.stringify(template.stages || []),
        JSON.stringify(template.resources || []),
        JSON.stringify(template.assessment || {}),
        JSON.stringify(template.homework || {}),
        template.notes || ''
      ], (err) => {
        if (err) {
          console.error(`❌ فشل استيراد: ${template.title}`, err.message);
          errors++;
        } else {
          console.log(`✅ تم استيراد: ${template.title}`);
          imported++;
        }
      });
    });
    
    setTimeout(() => {
      console.log(`\n📊 النتائج:`);
      console.log(`   ✅ نجح: ${imported}`);
      console.log(`   ❌ فشل: ${errors}\n`);
      db.close();
    }, 1000);
    
  } catch (error) {
    console.error('❌ خطأ في قراءة الملف:', error.message);
    db.close();
  }
}

// إذا تم تمرير ملف كمعامل
if (process.argv[2]) {
  const filePath = process.argv[2];
  if (fs.existsSync(filePath)) {
    importFromFile(filePath);
  } else {
    console.error('❌ الملف غير موجود:', filePath);
    db.close();
  }
}
