const express = require('express');
const router = express.Router();
const { Attendance, Student, Section } = require('../models');
const { Op } = require('sequelize');

// Helper function to get date range
function getDateRange(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    case 'week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0]
      };
    case 'month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0]
      };
    default:
      return {
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
  }
}

// GET /api/attendance-reports/overview - نظرة عامة على الإحصائيات
router.get('/overview', async (req, res) => {
  try {
    const { period = 'today', sectionId } = req.query;
    const { start, end } = getDateRange(period);

    // البناء الأساسي للاستعلام
    const whereClause = {
      date: {
        [Op.between]: [start, end]
      }
    };

    // فلترة حسب القسم إذا تم تحديده
    if (sectionId && sectionId !== 'all') {
      whereClause.sectionId = sectionId;
    }

    // جلب بيانات الحضور
    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Section,
          attributes: ['id', 'name', 'educationalLevel']
        }
      ]
    });

    // حساب الإحصائيات
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.isPresent).length;
    const absentCount = totalRecords - presentCount;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    // إحصائيات حسب القسم
    const sectionStats = {};
    attendanceRecords.forEach(record => {
      const sectionName = record.Section?.name || 'غير محدد';
      if (!sectionStats[sectionName]) {
        sectionStats[sectionName] = { total: 0, present: 0 };
      }
      sectionStats[sectionName].total++;
      if (record.isPresent) {
        sectionStats[sectionName].present++;
      }
    });

    const sectionAttendanceRates = Object.entries(sectionStats).map(([sectionName, stats]) => ({
      sectionName,
      total: stats.total,
      present: stats.present,
      absent: stats.total - stats.present,
      rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
    }));

    // الطلاب الأكثر غياباً (حساب من بداية العام)
    const studentAbsenceStats = await Attendance.findAll({
      where: {
        isPresent: false,
        ...(sectionId && sectionId !== 'all' && { sectionId })
      },
      attributes: [
        'studentId',
        [require('sequelize').fn('COUNT', '*'), 'absenceCount']
      ],
      include: [{
        model: Student,
        as: 'student',
        attributes: ['firstName', 'lastName']
      }],
      group: ['studentId'],
      order: [[require('sequelize').fn('COUNT', '*'), 'DESC']],
      limit: 10
    });

    const mostAbsentStudents = studentAbsenceStats.map(record => ({
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      absenceCount: record.dataValues.absenceCount
    }));

    res.json({
      period,
      dateRange: { start, end },
      overview: {
        totalRecords,
        presentCount,
        absentCount,
        attendanceRate
      },
      sectionStats: sectionAttendanceRates,
      mostAbsentStudents,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating attendance overview:', error);
    res.status(500).json({ 
      message: 'خطأ في توليد نظرة عامة على الحضور', 
      error: error.message 
    });
  }
});

// GET /api/attendance-reports/daily - تقرير يومي مفصل
router.get('/daily', async (req, res) => {
  try {
    const { date, sectionId } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const whereClause = { date: targetDate };
    if (sectionId && sectionId !== 'all') {
      whereClause.sectionId = sectionId;
    }

    const dailyAttendance = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'pathwayNumber']
        },
        {
          model: Section,
          attributes: ['id', 'name', 'educationalLevel']
        }
      ],
      order: [['sectionId', 'ASC'], [{ model: Student, as: 'student' }, 'firstName', 'ASC']]
    });

    // تنظيم البيانات حسب القسم
    const attendanceBySection = {};
    dailyAttendance.forEach(record => {
      const sectionName = record.Section?.name || 'غير محدد';
      if (!attendanceBySection[sectionName]) {
        attendanceBySection[sectionName] = {
          sectionInfo: record.Section,
          students: [],
          stats: { total: 0, present: 0, absent: 0 }
        };
      }
      
      attendanceBySection[sectionName].students.push({
        id: record.student.id,
        name: `${record.student.firstName} ${record.student.lastName}`,
        pathwayNumber: record.student.pathwayNumber,
        isPresent: record.isPresent,
        attendanceId: record.id
      });
      
      attendanceBySection[sectionName].stats.total++;
      if (record.isPresent) {
        attendanceBySection[sectionName].stats.present++;
      } else {
        attendanceBySection[sectionName].stats.absent++;
      }
    });

    res.json({
      date: targetDate,
      attendanceBySection,
      summary: {
        totalSections: Object.keys(attendanceBySection).length,
        totalStudents: dailyAttendance.length,
        totalPresent: dailyAttendance.filter(r => r.isPresent).length,
        totalAbsent: dailyAttendance.filter(r => !r.isPresent).length
      }
    });

  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ 
      message: 'خطأ في توليد التقرير اليومي', 
      error: error.message 
    });
  }
});

// GET /api/attendance-reports/weekly-trend - اتجاه الحضور الأسبوعي
router.get('/weekly-trend', async (req, res) => {
  try {
    const { sectionId } = req.query;
    
    // الحصول على آخر 7 أيام
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const whereClause = { date: dateStr };
      if (sectionId && sectionId !== 'all') {
        whereClause.sectionId = sectionId;
      }
      
      const dayAttendance = await Attendance.count({
        where: { ...whereClause, isPresent: true }
      });
      
      const dayTotal = await Attendance.count({
        where: whereClause
      });
      
      weeklyData.push({
        date: dateStr,
  dayOfWeek: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][date.getDay()],
        present: dayAttendance,
        total: dayTotal,
        rate: dayTotal > 0 ? Math.round((dayAttendance / dayTotal) * 100) : 0
      });
    }
    
    res.json({
      weeklyTrend: weeklyData,
      averageRate: weeklyData.length > 0 ? 
        Math.round(weeklyData.reduce((sum, day) => sum + day.rate, 0) / weeklyData.length) : 0
    });

  } catch (error) {
    console.error('Error generating weekly trend:', error);
    res.status(500).json({ 
      message: 'خطأ في توليد اتجاه الحضور الأسبوعي', 
      error: error.message 
    });
  }
});

// GET /api/attendance-reports/student-analysis - تحليل حضور الطالب الفردي
router.get('/student-analysis/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period = 'month' } = req.query;
    const { start, end } = getDateRange(period);

    // معلومات الطالب
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'الطالب غير موجود' });
    }

    // سجل الحضور للطالب
    const attendanceHistory = await Attendance.findAll({
      where: {
        studentId,
        date: {
          [Op.between]: [start, end]
        }
      },
      order: [['date', 'DESC']]
    });

    // الإحصائيات
    const totalDays = attendanceHistory.length;
    const presentDays = attendanceHistory.filter(record => record.isPresent).length;
    const absentDays = totalDays - presentDays;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // أنماط الغياب (أيام الأسبوع)
    const absencePatterns = {};
    attendanceHistory.filter(record => !record.isPresent).forEach(record => {
      const dayOfWeek = new Date(record.date).getDay();
      const dayName = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek];
      absencePatterns[dayName] = (absencePatterns[dayName] || 0) + 1;
    });

    res.json({
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        pathwayNumber: student.pathwayNumber
      },
      period: { start, end },
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        attendanceRate
      },
      attendanceHistory: attendanceHistory.map(record => ({
        date: record.date,
        isPresent: record.isPresent,
  dayOfWeek: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][new Date(record.date).getDay()]
      })),
      absencePatterns
    });

  } catch (error) {
    console.error('Error generating student analysis:', error);
    res.status(500).json({ 
      message: 'خطأ في توليد تحليل حضور الطالب', 
      error: error.message 
    });
  }
});

module.exports = router;