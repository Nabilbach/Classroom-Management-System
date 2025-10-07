const express = require('express');
const router = express.Router();
const { Student, Attendance, Section, sequelize } = require('../models');

// POST /api/student-transfer - نقل تلميذ من قسم إلى آخر بشكل آمن
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { studentId, newSectionId, transferDate, preserveHistory = true, transferReason = '' } = req.body;

    // التحقق من صحة البيانات
    if (!studentId || !newSectionId) {
      return res.status(400).json({ 
        message: 'Student ID and new section ID are required' 
      });
    }

    // البحث عن التلميذ والأقسام
    const student = await Student.findByPk(studentId, { transaction });
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Student not found' });
    }

    const oldSectionId = student.sectionId;
    const oldSection = await Section.findByPk(oldSectionId, { transaction });
    const newSection = await Section.findByPk(newSectionId, { transaction });

    if (!newSection) {
      await transaction.rollback();
      return res.status(404).json({ message: 'New section not found' });
    }

    // منع النقل إلى نفس القسم
    if (oldSectionId === newSectionId) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Student is already in this section' 
      });
    }

    // إحصاءات ما قبل النقل
    const attendanceStats = await Attendance.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalRecords'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN isPresent = 1 THEN 1 ELSE 0 END')), 'presentCount'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN isPresent = 0 THEN 1 ELSE 0 END')), 'absentCount']
      ],
      where: { studentId },
      transaction,
      raw: true
    });

    const stats = attendanceStats[0] || { totalRecords: 0, presentCount: 0, absentCount: 0 };

    // تحديث معلومات التلميذ
    await student.update({ 
      sectionId: newSectionId,
      updatedAt: new Date()
    }, { transaction });

    // إنشاء سجل النقل
    const transferRecord = {
      studentId: studentId,
      studentName: `${student.first_name} ${student.last_name}`,
      oldSectionId: oldSectionId,
      oldSectionName: oldSection?.name || 'Unknown',
      newSectionId: newSectionId,
      newSectionName: newSection.name,
      transferDate: transferDate || new Date().toISOString().split('T')[0],
      transferReason: transferReason,
      preserveHistory: preserveHistory,
      attendanceStats: {
        totalRecords: parseInt(stats.totalRecords) || 0,
        presentCount: parseInt(stats.presentCount) || 0,
        absentCount: parseInt(stats.absentCount) || 0
      },
      createdAt: new Date()
    };

    // حفظ سجل النقل في جدول منفصل (سنضيفه لاحقاً)
    // await StudentTransfer.create(transferRecord, { transaction });

    // إذا لم نحافظ على التاريخ، احذف السجلات القديمة
    if (!preserveHistory) {
      const deletedCount = await Attendance.destroy({
        where: { studentId, sectionId: oldSectionId },
        transaction
      });
      console.log(`Deleted ${deletedCount} old attendance records for student ${studentId}`);
    }

    await transaction.commit();

    // إرجاع تفاصيل النقل
    res.json({
      success: true,
      message: `Student successfully transferred from ${oldSection?.name || 'Unknown'} to ${newSection.name}`,
      transfer: transferRecord,
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        oldSection: oldSection?.name || 'Unknown',
        newSection: newSection.name
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error transferring student:', error);
    res.status(500).json({ 
      message: 'Failed to transfer student', 
      error: error.message 
    });
  }
});

// GET /api/student-transfer/history/:studentId - تاريخ نقل تلميذ معين
router.get('/history/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // البحث عن التلميذ
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // البحث عن سجلات الحضور بأقسام مختلفة (مؤشر على النقل)
    const attendanceSections = await Attendance.findAll({
      attributes: ['sectionId', [sequelize.fn('COUNT', sequelize.col('id')), 'recordCount']],
      where: { studentId },
      include: [{
        model: Section,
        attributes: ['id', 'name', 'educationalLevel']
      }],
      group: ['sectionId', 'Section.id'],
      order: [[sequelize.fn('MIN', sequelize.col('date')), 'ASC']]
    });

    res.json({
      studentId,
      studentName: `${student.first_name} ${student.last_name}`,
      currentSection: student.sectionId,
      transferHistory: attendanceSections.map(record => ({
        sectionId: record.sectionId,
        sectionName: record.Section?.name || 'Unknown',
        educationalLevel: record.Section?.educationalLevel || 'Unknown',
        recordCount: parseInt(record.dataValues.recordCount)
      }))
    });

  } catch (error) {
    console.error('Error fetching transfer history:', error);
    res.status(500).json({ 
      message: 'Failed to fetch transfer history', 
      error: error.message 
    });
  }
});

// POST /api/student-transfer/validate - التحقق من إمكانية النقل
router.post('/validate', async (req, res) => {
  try {
    const { studentId, newSectionId } = req.body;

    const student = await Student.findByPk(studentId);
    const newSection = await Section.findByPk(newSectionId);

    if (!student) {
      return res.status(404).json({ valid: false, message: 'Student not found' });
    }
    if (!newSection) {
      return res.status(404).json({ valid: false, message: 'Section not found' });
    }
    if (student.sectionId === newSectionId) {
      return res.status(400).json({ valid: false, message: 'Student is already in this section' });
    }

    // عد سجلات الحضور الحالية
    const attendanceCount = await Attendance.count({
      where: { studentId }
    });

    // عد الطلاب في القسم الجديد
    const sectionStudentCount = await Student.count({
      where: { sectionId: newSectionId }
    });

    res.json({
      valid: true,
      message: 'Transfer is possible',
      details: {
        studentName: `${student.first_name} ${student.last_name}`,
        currentSection: student.sectionId,
        newSection: newSection.name,
        attendanceRecordsCount: attendanceCount,
        newSectionStudentCount: sectionStudentCount
      }
    });

  } catch (error) {
    console.error('Error validating transfer:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Failed to validate transfer', 
      error: error.message 
    });
  }
});

module.exports = router;