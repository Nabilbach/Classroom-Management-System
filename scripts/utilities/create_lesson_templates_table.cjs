const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'classroom.db');

console.log('🔨 إنشاء جدول قوالب الدروس في قاعدة البيانات الرئيسية\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطأ في فتح قاعدة البيانات:', err.message);
    return;
  }
  
  console.log('✅ تم فتح قاعدة البيانات بنجاح');
  
  // التحقق من وجود الجدول أولاً
  db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='LessonTemplates'`, (err, row) => {
    if (row) {
      console.log('ℹ️ جدول LessonTemplates موجود بالفعل');
      
      // فحص البنية الحالية
      db.all(`PRAGMA table_info(LessonTemplates)`, (err, columns) => {
        console.log('📋 بنية الجدول الحالية:');
        columns.forEach(col => {
          console.log(`  - ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
        });
        
        // فحص عدد السجلات
        db.get(`SELECT COUNT(*) as count FROM LessonTemplates`, (err, result) => {
          console.log(`📊 عدد القوالب الموجودة: ${result ? result.count : 0}`);
          db.close();
        });
      });
    } else {
      console.log('🔨 إنشاء جدول قوالب الدروس جديد...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS LessonTemplates (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          subject TEXT DEFAULT 'التربية الإسلامية',
          grade TEXT DEFAULT 'الجذع المشترك',
          duration INTEGER DEFAULT 50,
          objectives TEXT,
          content TEXT,
          stages TEXT,
          resources TEXT,
          assessment TEXT,
          homework TEXT,
          notes TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          
          -- للتوافق مع النظام القديم
          description TEXT,
          estimatedSessions INTEGER DEFAULT 1,
          courseName TEXT DEFAULT 'التربية الإسلامية',
          level TEXT DEFAULT 'الجذع المشترك',
          weekNumber INTEGER,
          scheduledSections TEXT
        )
      `;
      
      db.run(createTableSQL, (err) => {
        if (err) {
          console.error('❌ خطأ في إنشاء الجدول:', err.message);
        } else {
          console.log('✅ تم إنشاء جدول LessonTemplates بنجاح');
          
          // إدراج قالب تجريبي
          const sampleTemplate = {
            id: 'tpl-001',
            title: 'التوحيد وأدلته',
            subject: 'التربية الإسلامية', 
            grade: 'الجذع المشترك',
            content: 'درس حول مفهوم التوحيد وأدلته من القرآن والسنة',
            objectives: JSON.stringify(['فهم مفهوم التوحيد', 'معرفة أدلة التوحيد']),
            stages: JSON.stringify([
              { id: 's1', title: 'التمهيد', isCompleted: false },
              { id: 's2', title: 'العرض', isCompleted: false },
              { id: 's3', title: 'التقويم', isCompleted: false }
            ]),
            weekNumber: 3
          };
          
          const insertSQL = `
            INSERT INTO LessonTemplates (
              id, title, subject, grade, content, objectives, stages, weekNumber,
              description, courseName, level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          db.run(insertSQL, [
            sampleTemplate.id,
            sampleTemplate.title, 
            sampleTemplate.subject,
            sampleTemplate.grade,
            sampleTemplate.content,
            sampleTemplate.objectives,
            sampleTemplate.stages,
            sampleTemplate.weekNumber,
            sampleTemplate.content, // description
            sampleTemplate.subject, // courseName  
            sampleTemplate.grade     // level
          ], (err) => {
            if (err) {
              console.error('❌ خطأ في إدراج القالب التجريبي:', err.message);
            } else {
              console.log('✅ تم إدراج قالب تجريبي بنجاح');
              console.log(`📝 القالب: "${sampleTemplate.title}"`);
            }
            
            db.close();
          });
        }
      });
    }
  });
});