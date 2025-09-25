const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 إنشاء جدول قوالب الدروس...');

db.serialize(() => {
  // إنشاء جدول LessonTemplates
  db.run(`
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.log('❌ خطأ في إنشاء الجدول:', err.message);
    } else {
      console.log('✅ تم إنشاء جدول LessonTemplates بنجاح');
    }
  });

  // إنشاء فهرس للبحث السريع
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_lesson_templates_subject_grade 
    ON LessonTemplates(subject, grade)
  `, (err) => {
    if (err) {
      console.log('❌ خطأ في إنشاء الفهرس:', err.message);
    } else {
      console.log('✅ تم إنشاء فهرس البحث بنجاح');
    }
  });

  // إنشاء trigger لتحديث updatedAt تلقائياً
  db.run(`
    CREATE TRIGGER IF NOT EXISTS update_lesson_templates_timestamp 
    AFTER UPDATE ON LessonTemplates
    FOR EACH ROW
    BEGIN
      UPDATE LessonTemplates SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `, (err) => {
    if (err) {
      console.log('❌ خطأ في إنشاء المحفز:', err.message);
    } else {
      console.log('✅ تم إنشاء محفز التحديث التلقائي بنجاح');
    }
    
    // التحقق من الجدول النهائي
    db.get("SELECT COUNT(*) as count FROM LessonTemplates", (err, result) => {
      if (err) {
        console.log('❌ خطأ في التحقق:', err.message);
      } else {
        console.log('📊 عدد القوالب الحالية:', result.count);
        console.log('🎉 النظام جاهز لاستيراد القوالب');
      }
      db.close();
    });
  });
});