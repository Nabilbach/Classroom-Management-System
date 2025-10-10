const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to DB');
    const sectionCount = await db.Section.count();
    const studentCount = await db.Student.count();
    console.log(`Sections: ${sectionCount}, Students: ${studentCount}`);
    const sections = await db.Section.findAll({ limit: 10 });
    const students = await db.Student.findAll({ limit: 10 });
    console.log('Sample sections:', sections.map(s => s.toJSON()));
    console.log('Sample students:', students.map(s => s.toJSON()));
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
})();
