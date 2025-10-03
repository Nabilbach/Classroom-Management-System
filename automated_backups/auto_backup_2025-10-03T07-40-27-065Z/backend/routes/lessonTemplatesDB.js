const db = require('../config/database');

// جلب جميع قوالب الدروس
const getAllLessonTemplates = (req, res) => {
  console.log('📚 جلب جميع قوالب الدروس...');
  
  db.all(`
    SELECT * FROM LessonTemplates 
    ORDER BY subject, grade, title
  `, (err, rows) => {
    if (err) {
      console.error('❌ خطأ في جلب القوالب:', err.message);
      return res.status(500).json({ error: 'خطأ في جلب قوالب الدروس' });
    }
    
    // تحويل البيانات النصية إلى JSON
    const templates = rows.map(row => ({
      ...row,
      stages: row.stages ? JSON.parse(row.stages) : [],
      objectives: row.objectives ? JSON.parse(row.objectives) : [],
      resources: row.resources ? JSON.parse(row.resources) : [],
      assessment: row.assessment ? JSON.parse(row.assessment) : {},
      homework: row.homework ? JSON.parse(row.homework) : {}
    }));
    
    console.log(`✅ تم جلب ${templates.length} قالب`);
    res.json(templates);
  });
};

// إنشاء قالب جديد
const createLessonTemplate = (req, res) => {
  const {
    title, subject, grade, duration = 50,
    objectives = [], content = '', stages = [],
    resources = [], assessment = {}, homework = {}, notes = ''
  } = req.body;

  if (!title || !subject || !grade) {
    return res.status(400).json({ error: 'العنوان والمادة والصف مطلوبة' });
  }

  const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  console.log('➕ إنشاء قالب جديد:', title);

  db.run(`
    INSERT INTO LessonTemplates (
      id, title, subject, grade, duration, objectives, content, 
      stages, resources, assessment, homework, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, title, subject, grade, duration,
    JSON.stringify(objectives), content, JSON.stringify(stages),
    JSON.stringify(resources), JSON.stringify(assessment),
    JSON.stringify(homework), notes
  ], function(err) {
    if (err) {
      console.error('❌ خطأ في إنشاء القالب:', err.message);
      return res.status(500).json({ error: 'خطأ في إنشاء قالب الدرس' });
    }
    
    console.log('✅ تم إنشاء القالب بنجاح');
    
    // إرجاع القالب المُنشأ
    db.get('SELECT * FROM LessonTemplates WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'خطأ في جلب القالب المُنشأ' });
      }
      
      const template = {
        ...row,
        stages: JSON.parse(row.stages),
        objectives: JSON.parse(row.objectives),
        resources: JSON.parse(row.resources),
        assessment: JSON.parse(row.assessment),
        homework: JSON.parse(row.homework)
      };
      
      res.status(201).json(template);
    });
  });
};

// تحديث قالب موجود
const updateLessonTemplate = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  console.log('🔄 تحديث القالب:', id);

  // تحويل الكائنات إلى JSON
  if (updates.stages) updates.stages = JSON.stringify(updates.stages);
  if (updates.objectives) updates.objectives = JSON.stringify(updates.objectives);
  if (updates.resources) updates.resources = JSON.stringify(updates.resources);
  if (updates.assessment) updates.assessment = JSON.stringify(updates.assessment);
  if (updates.homework) updates.homework = JSON.stringify(updates.homework);

  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(id);

  db.run(`UPDATE LessonTemplates SET ${fields} WHERE id = ?`, values, function(err) {
    if (err) {
      console.error('❌ خطأ في تحديث القالب:', err.message);
      return res.status(500).json({ error: 'خطأ في تحديث قالب الدرس' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'قالب الدرس غير موجود' });
    }
    
    console.log('✅ تم تحديث القالب بنجاح');
    
    // إرجاع القالب المحدث
    db.get('SELECT * FROM LessonTemplates WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'خطأ في جلب القالب المحدث' });
      }
      
      const template = {
        ...row,
        stages: JSON.parse(row.stages),
        objectives: JSON.parse(row.objectives),
        resources: JSON.parse(row.resources),
        assessment: JSON.parse(row.assessment),
        homework: JSON.parse(row.homework)
      };
      
      res.json(template);
    });
  });
};

// حذف قالب
const deleteLessonTemplate = (req, res) => {
  const { id } = req.params;
  
  console.log('🗑️ حذف القالب:', id);

  // التحقق من وجود حصص مرتبطة بهذا القالب
  db.get('SELECT COUNT(*) as count FROM ScheduledLessons WHERE templateId = ?', [id], (err, result) => {
    if (err) {
      console.error('❌ خطأ في التحقق من الحصص المرتبطة:', err.message);
      return res.status(500).json({ error: 'خطأ في التحقق من الحصص المرتبطة' });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ 
        error: `لا يمكن حذف القالب لأن هناك ${result.count} حصة مرتبطة به`,
        linkedLessons: result.count
      });
    }
    
    // حذف القالب
    db.run('DELETE FROM LessonTemplates WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('❌ خطأ في حذف القالب:', err.message);
        return res.status(500).json({ error: 'خطأ في حذف قالب الدرس' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'قالب الدرس غير موجود' });
      }
      
      console.log('✅ تم حذف القالب بنجاح');
      res.json({ message: 'تم حذف قالب الدرس بنجاح' });
    });
  });
};

// استيراد قوالب متعددة (للنسخة الاحتياطية)
const importLessonTemplates = (req, res) => {
  const { templates } = req.body;
  
  if (!Array.isArray(templates)) {
    return res.status(400).json({ error: 'يجب أن تكون القوالب في شكل مصفوفة' });
  }
  
  console.log(`📥 استيراد ${templates.length} قالب...`);
  
  let imported = 0;
  let errors = [];
  
  const importNext = (index) => {
    if (index >= templates.length) {
      console.log(`✅ تم استيراد ${imported} قالب من ${templates.length}`);
      return res.json({ 
        imported, 
        total: templates.length, 
        errors: errors.length > 0 ? errors : undefined 
      });
    }
    
    const template = templates[index];
    const id = template.id || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    db.run(`
      INSERT OR REPLACE INTO LessonTemplates (
        id, title, subject, grade, duration, objectives, content, 
        stages, resources, assessment, homework, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, template.title, template.subject, template.grade, template.duration || 50,
      JSON.stringify(template.objectives || []), template.content || '',
      JSON.stringify(template.stages || []), JSON.stringify(template.resources || []),
      JSON.stringify(template.assessment || {}), JSON.stringify(template.homework || {}),
      template.notes || ''
    ], function(err) {
      if (err) {
        console.error(`❌ خطأ في استيراد القالب ${template.title}:`, err.message);
        errors.push({ template: template.title, error: err.message });
      } else {
        imported++;
      }
      
      // الانتقال للقالب التالي
      importNext(index + 1);
    });
  };
  
  importNext(0);
};

module.exports = {
  getAllLessonTemplates,
  createLessonTemplate,
  updateLessonTemplate,
  deleteLessonTemplate,
  importLessonTemplates
};