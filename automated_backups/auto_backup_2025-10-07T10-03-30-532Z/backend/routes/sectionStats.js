const express = require('express');
const router = express.Router();
const { Section, Student } = require('../models');

/**
 * Get section statistics and filter options
 */
const getSectionStats = async (req, res) => {
  try {
    // Get all sections with their associated students
    const sections = await Section.findAll({
      include: [{
        model: Student,
        as: 'Students',
        attributes: ['id']
      }]
    });

    // Calculate statistics
    const totalSections = sections.length;
    const totalStudents = await Student.count();
    
    // Group by educational level
    const levelStats = {};
    const specializationStats = {};
    const availableLevels = new Set();
    const availableSpecializations = new Set();
    
    sections.forEach(section => {
      const level = section.educationalLevel || 'غير محدد';
      const specialization = section.specialization || 'غير محدد';
      const studentCount = section.Students ? section.Students.length : 0;
      
      // Track available levels and specializations
      if (section.educationalLevel) availableLevels.add(section.educationalLevel);
      if (section.specialization) availableSpecializations.add(section.specialization);
      
      // Level statistics
      if (!levelStats[level]) {
        levelStats[level] = {
          level,
          sectionsCount: 0,
          studentsCount: 0,
          sections: []
        };
      }
      levelStats[level].sectionsCount++;
      levelStats[level].studentsCount += studentCount;
      levelStats[level].sections.push({
        id: section.id,
        name: section.name,
        studentCount
      });
      
      // Specialization statistics
      if (!specializationStats[specialization]) {
        specializationStats[specialization] = {
          specialization,
          sectionsCount: 0,
          studentsCount: 0,
          sections: []
        };
      }
      specializationStats[specialization].sectionsCount++;
      specializationStats[specialization].studentsCount += studentCount;
      specializationStats[specialization].sections.push({
        id: section.id,
        name: section.name,
        studentCount
      });
    });

    // Find most crowded section
    let mostCrowdedSection = null;
    let maxStudents = 0;
    sections.forEach(section => {
      const studentCount = section.Students ? section.Students.length : 0;
      if (studentCount > maxStudents) {
        maxStudents = studentCount;
        mostCrowdedSection = {
          id: section.id,
          name: section.name,
          level: section.educationalLevel,
          specialization: section.specialization,
          studentCount
        };
      }
    });

    res.json({
      summary: {
        totalSections,
        totalStudents,
        mostCrowdedSection
      },
      levelStats: Object.values(levelStats),
      specializationStats: Object.values(specializationStats),
      filters: {
        availableLevels: Array.from(availableLevels).sort(),
        availableSpecializations: Array.from(availableSpecializations).sort()
      }
    });

  } catch (error) {
    console.error('Error getting section stats:', error);
    res.status(500).json({ 
      error: 'فشل في جلب إحصائيات الأقسام',
      details: error.message 
    });
  }
};

/**
 * Get sections grouped by educational level
 */
const getSectionsByLevel = async (req, res) => {
  try {
    const { level } = req.params;
    
    const whereClause = level && level !== 'all' 
      ? { educationalLevel: level }
      : {};

    const sections = await Section.findAll({
      where: whereClause,
      include: [{
        model: Student,
        as: 'Students',
        attributes: ['id', 'firstName', 'lastName']
      }],
      order: [['name', 'ASC']]
    });

    // Group sections by educational level
    const groupedSections = {};
    sections.forEach(section => {
      const sectionLevel = section.educationalLevel || 'غير محدد';
      if (!groupedSections[sectionLevel]) {
        groupedSections[sectionLevel] = [];
      }
      
      groupedSections[sectionLevel].push({
        id: section.id,
        name: section.name,
        educationalLevel: section.educationalLevel,
        specialization: section.specialization,
        teacherName: section.teacherName,
        roomNumber: section.roomNumber,
        courseName: section.courseName,
        studentCount: section.Students ? section.Students.length : 0,
        students: section.Students || []
      });
    });

    res.json({
      level: level === 'all' ? 'جميع المستويات' : level,
      groupedSections,
      totalSections: sections.length,
      totalStudents: sections.reduce((sum, section) => 
        sum + (section.Students ? section.Students.length : 0), 0
      )
    });

  } catch (error) {
    console.error('Error getting sections by level:', error);
    res.status(500).json({ 
      error: 'فشل في جلب الأقسام حسب المستوى',
      details: error.message 
    });
  }
};

// Routes
router.get('/', getSectionStats);
router.get('/level/:level', getSectionsByLevel);

module.exports = router;