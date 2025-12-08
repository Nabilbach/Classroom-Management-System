const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// Helper function to safely parse JSON fields
const parseJsonField = (value, defaultValue) => {
  if (!value) return defaultValue;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return defaultValue;
  }
};

// Helper function to transform row to template object
const transformTemplate = (row) => ({
  ...row,
  stages: parseJsonField(row.stages, []),
  scheduledSections: parseJsonField(row.scheduledSections, [])
});

// جلب جميع قوالب الدروس
const getAllLessonTemplates = async (req, res) => {
  try {
    console.log('📚 جلب جميع قوالب الدروس...');
    console.log('Query: SELECT * FROM LessonTemplates ORDER BY courseName, level, title');
    
    const rows = await sequelize.query(
      `SELECT * FROM LessonTemplates ORDER BY courseName, level, title`,
      { type: QueryTypes.SELECT }
    );
    
    console.log(`✅ تم جلب ${rows.length} صف`);
    
    const templates = rows.map(transformTemplate);
    
    console.log(`✅ تم تحويل ${templates.length} قالب`);
    res.json(templates);
  } catch (err) {
    console.error('❌ خطأ في جلب القوالب:', err.message);
    console.error('Stack:', err.stack);
    return res.status(500).json({ error: 'خطأ في جلب قوالب الدروس', details: err.message });
  }
};

// إنشاء قالب جديد
const createLessonTemplate = async (req, res) => {
  try {
    const {
      title, description = '', estimatedSessions = 1,
      stages = [], courseName = '', level = '',
      weekNumber = null, scheduledSections = []
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'العنوان مطلوب' });
    }

    const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    
    console.log('➕ إنشاء قالب جديد:', title);

    await sequelize.query(`
      INSERT INTO LessonTemplates (
        id, title, description, estimatedSessions, stages, 
        courseName, level, weekNumber, scheduledSections, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        id, title, description, estimatedSessions,
        JSON.stringify(stages), courseName, level,
        weekNumber, JSON.stringify(scheduledSections), now, now
      ],
      type: QueryTypes.INSERT
    });
    
    console.log('✅ تم إنشاء القالب بنجاح');
    
    // إرجاع القالب المُنشأ
    const [row] = await sequelize.query(
      'SELECT * FROM LessonTemplates WHERE id = ?',
      { replacements: [id], type: QueryTypes.SELECT }
    );
    
    res.status(201).json(transformTemplate(row));
  } catch (err) {
    console.error('❌ خطأ في إنشاء القالب:', err.message);
    return res.status(500).json({ error: 'خطأ في إنشاء قالب الدرس' });
  }
};

// تحديث قالب موجود
const updateLessonTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    console.log('🔄 تحديث القالب:', id);

    // تحويل الكائنات إلى JSON
    if (updates.stages) updates.stages = JSON.stringify(updates.stages);
    if (updates.scheduledSections) updates.scheduledSections = JSON.stringify(updates.scheduledSections);
    
    // Add updatedAt
    updates.updatedAt = new Date().toISOString();

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    await sequelize.query(
      `UPDATE LessonTemplates SET ${fields} WHERE id = ?`,
      { replacements: values, type: QueryTypes.UPDATE }
    );
    
    // Check if template exists and return updated version
    const [checkRow] = await sequelize.query(
      'SELECT * FROM LessonTemplates WHERE id = ?',
      { replacements: [id], type: QueryTypes.SELECT }
    );
    
    if (!checkRow) {
      return res.status(404).json({ error: 'قالب الدرس غير موجود' });
    }
    
    console.log('✅ تم تحديث القالب بنجاح');
    res.json(transformTemplate(checkRow));
  } catch (err) {
    console.error('❌ خطأ في تحديث القالب:', err.message);
    return res.status(500).json({ error: 'خطأ في تحديث قالب الدرس' });
  }
};

// حذف قالب
const deleteLessonTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ حذف القالب:', id);

    // Check if template exists first
    const [existing] = await sequelize.query(
      'SELECT id FROM LessonTemplates WHERE id = ?',
      { replacements: [id], type: QueryTypes.SELECT }
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'قالب الدرس غير موجود' });
    }

    await sequelize.query(
      'DELETE FROM LessonTemplates WHERE id = ?',
      { replacements: [id], type: QueryTypes.DELETE }
    );
    
    console.log('✅ تم حذف القالب بنجاح');
    res.json({ message: 'تم حذف قالب الدرس بنجاح' });
  } catch (err) {
    console.error('❌ خطأ في حذف القالب:', err.message);
    return res.status(500).json({ error: 'خطأ في حذف قالب الدرس' });
  }
};

// استيراد قوالب متعددة (للنسخة الاحتياطية)
const importLessonTemplates = async (req, res) => {
  try {
    const { templates } = req.body;
    
    if (!Array.isArray(templates)) {
      return res.status(400).json({ error: 'يجب أن تكون القوالب في شكل مصفوفة' });
    }
    
    console.log(`📥 استيراد ${templates.length} قالب...`);
    
    let imported = 0;
    let errors = [];
    const now = new Date().toISOString();
    
    for (const template of templates) {
      try {
        const id = template.id || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        
        await sequelize.query(`
          INSERT OR REPLACE INTO LessonTemplates (
            id, title, description, estimatedSessions, stages, 
            courseName, level, weekNumber, scheduledSections, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            id, template.title, template.description || '',
            template.estimatedSessions || 1, JSON.stringify(template.stages || []),
            template.courseName || '', template.level || '',
            template.weekNumber || null, JSON.stringify(template.scheduledSections || []),
            template.createdAt || now, now
          ],
          type: QueryTypes.INSERT
        });
        
        imported++;
      } catch (err) {
        console.error(`❌ خطأ في استيراد القالب ${template.title}:`, err.message);
        errors.push({ template: template.title, error: err.message });
      }
    }
    
    console.log(`✅ تم استيراد ${imported} قالب من ${templates.length}`);
    res.json({ 
      imported, 
      total: templates.length, 
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (err) {
    console.error('❌ خطأ في استيراد القوالب:', err.message);
    return res.status(500).json({ error: 'خطأ في استيراد القوالب' });
  }
};

module.exports = {
  getAllLessonTemplates,
  createLessonTemplate,
  updateLessonTemplate,
  deleteLessonTemplate,
  importLessonTemplates
};