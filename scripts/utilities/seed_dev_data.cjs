#!/usr/bin/env node

/**
 * Seed development database with dummy data - Simplified version
 * Usage: node seed_dev_data.cjs
 * 
 * ⚠️  SAFETY WARNING: This script is designed ONLY for development environments!
 * It will refuse to run against the production database.
 */

// CRITICAL: Load development environment FIRST
require('dotenv').config({ path: require('path').join(__dirname, '.env.development') });

const path = require('path');
const db = require('./backend/models');

// Safety check: Prevent running on production database
const ENV = process.env.NODE_ENV || 'development';
const DB_PATH = process.env.DB_PATH || '';

// Multiple safety checks
const isProduction = ENV === 'production' || 
                     DB_PATH === 'classroom.db' || 
                     DB_PATH === '' ||
                     !DB_PATH.includes('_dev');

if (isProduction) {
  console.error('\n❌ SAFETY ERROR: Refusing to seed production database!');
  console.error('📍 Environment: ' + ENV);
  console.error('💾 Database: ' + DB_PATH);
  console.error('\n⚠️  This script is ONLY for development (classroom_dev.db)');
  console.error('✅ DB_PATH must contain "_dev" to proceed');
  process.exit(1);
}

console.log('\n✅ SAFETY CHECK PASSED:');
console.log('   Environment: ' + ENV);
console.log('   Database: ' + DB_PATH);
console.log('');

const seedData = async () => {
  try {
    console.log('🌱 Starting to seed development database...');

    // Sync database
    await db.sequelize.sync({ force: false });
    console.log('✅ Database synced');

    console.log('ℹ️  Seeding with dummy data...');
    console.log('📊 This will add:');
    console.log('   - 3 sections');
    console.log('   - 10 students');
    console.log('   - 5 lessons');
    console.log('   - 30 attendance records');

    // Use raw queries for better compatibility
    await db.sequelize.query(`
      INSERT OR IGNORE INTO Sections (id, name, educationalLevel, createdAt, updatedAt)
      VALUES 
        ('s1', 'الأولى ثانوي - ع.ت', 'ثانوي', datetime('now'), datetime('now')),
        ('s2', 'الثانية ثانوي - رياضيات', 'ثانوي', datetime('now'), datetime('now')),
        ('s3', 'الأولى ثانوي - آداب', 'ثانوي', datetime('now'), datetime('now'))
    `);
    console.log('✅ Sections created');

    await db.sequelize.query(`
      INSERT OR IGNORE INTO Students (first_name, last_name, section_id, createdAt, updatedAt)
      VALUES 
        ('محمد', 'أحمد', 's1', datetime('now'), datetime('now')),
        ('فاطمة', 'حسن', 's1', datetime('now'), datetime('now')),
        ('علي', 'محمود', 's1', datetime('now'), datetime('now')),
        ('سارة', 'علي', 's1', datetime('now'), datetime('now')),
        ('أحمد', 'خالد', 's1', datetime('now'), datetime('now')),
        ('نور', 'محمد', 's2', datetime('now'), datetime('now')),
        ('كريم', 'حسن', 's2', datetime('now'), datetime('now')),
        ('ليلى', 'أحمد', 's2', datetime('now'), datetime('now')),
        ('عمر', 'علي', 's3', datetime('now'), datetime('now')),
        ('زيد', 'محمود', 's3', datetime('now'), datetime('now'))
    `);
    console.log('✅ Students created');

    await db.sequelize.query(`
      INSERT OR IGNORE INTO Lessons (id, templateId, sectionId, date, status, actualContent, createdAt, updatedAt)
      VALUES 
        ('l1', NULL, 's1', '2025-11-20', 'completed', 'فهم مفهوم المشتقات الأساسي', datetime('now'), datetime('now')),
        ('l2', NULL, 's1', '2025-11-21', 'completed', 'تطبيق قواعد التكامل', datetime('now'), datetime('now')),
        ('l3', NULL, 's1', '2025-11-22', 'in-progress', 'حل المعادلات التفاضلية البسيطة', datetime('now'), datetime('now')),
        ('l4', NULL, 's2', '2025-11-20', 'completed', 'فهم قوانين الحركة الثلاثة', datetime('now'), datetime('now')),
        ('l5', NULL, 's3', '2025-11-21', 'in-progress', 'تحليل النصوص الأدبية', datetime('now'), datetime('now'))
    `);
    console.log('✅ Lessons created');

    // Create Attendance records - need to get student IDs first
    const [studentIds] = await db.sequelize.query(
      'SELECT id FROM Students LIMIT 10'
    );
    
    if (studentIds && studentIds.length > 0) {
      const attendanceInserts = studentIds.flatMap((student, idx) => {
        const records = [];
        for (let i = 0; i < 3; i++) {
          const dateOffset = i * 24 * 60 * 60 * 1000;
          const date = new Date(Date.now() - dateOffset).toISOString().split('T')[0];
          records.push(
            `(${student.id}, 's${(idx % 3) + 1}', '${date}', ${Math.random() > 0.2 ? 1 : 0}, datetime('now'), datetime('now'))`
          );
        }
        return records;
      });

      await db.sequelize.query(`
        INSERT OR IGNORE INTO Attendances (studentId, sectionId, date, isPresent, createdAt, updatedAt)
        VALUES 
          ${attendanceInserts.join(', ')}
      `);
      console.log(`✅ Created attendance records`);
    }

    console.log('\n🎉 Development database seeded successfully!');
    console.log('📊 Summary:');
    console.log('   - Sections: 3');
    console.log('   - Students: 10');
    console.log('   - Lessons: 5');
    console.log('\n✅ Safe: Seeding completed on development database only (classroom_dev.db)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();

