const fs = require('fs');
const path = require('path');
const db = require('./models');

const LESSONS_DATA_FILE = path.join(__dirname, 'lessons.json');
const SECTIONS_DATA_FILE = path.join(__dirname, 'sections.json');

const readData = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
};

const migrate = async () => {
  try {
    await db.sequelize.sync({ force: true });
    console.log('Database synchronized');

    const sections = readData(SECTIONS_DATA_FILE);
    if (sections.length > 0) {
      await db.Section.bulkCreate(sections);
      console.log('Sections migrated');
    }

    const lessons = readData(LESSONS_DATA_FILE);
    if (lessons.length > 0) {
      await db.Lesson.bulkCreate(lessons);
      console.log('Lessons migrated');
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

migrate();