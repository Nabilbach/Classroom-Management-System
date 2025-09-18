const fs = require('fs');
const path = require('path');
const db = require('./models');

const LESSONS_DATA_FILE = path.join(__dirname, 'lessons.json');
const SECTIONS_DATA_FILE = path.join(__dirname, 'sections.json');
const SCHEDULED_LESSONS_DATA_FILE = path.join(__dirname, 'scheduledLessons.json'); // New constant

const readData = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
};

const migrate = async () => {
  try {
    await db.sequelize.sync(); // Removed { force: true }
    console.log('Database synchronized');

    const sectionsData = readData(SECTIONS_DATA_FILE);
    if (sectionsData.length > 0) {
      const existingSections = await db.Section.count();
      if (existingSections === 0) { // Only bulkCreate if no sections exist
        await db.Section.bulkCreate(sectionsData);
        console.log('Sections migrated');
      } else {
        console.log('Sections already exist, skipping migration.');
      }
    }

    const lessonsData = readData(LESSONS_DATA_FILE);
    if (lessonsData.length > 0) {
      const existingLessons = await db.Lesson.count();
      if (existingLessons === 0) { // Only bulkCreate if no lessons exist
        await db.Lesson.bulkCreate(lessonsData);
        console.log('Lessons migrated');
      } else {
        console.log('Lessons already exist, skipping migration.');
      }
    }

    const scheduledLessonsData = readData(SCHEDULED_LESSONS_DATA_FILE);
    if (scheduledLessonsData.length > 0) {
      const existingScheduledLessons = await db.ScheduledLesson.count();
      if (existingScheduledLessons === 0) { // Only bulkCreate if no scheduled lessons exist
        await db.ScheduledLesson.bulkCreate(scheduledLessonsData);
        console.log('ScheduledLessons migrated');
      } else {
        console.log('ScheduledLessons already exist, skipping migration.');
      }
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

migrate();