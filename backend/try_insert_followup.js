const db = require('./models');

async function run() {
  try {
    const studentId = 606;
    const student = await db.Student.findByPk(studentId);
    console.log('Found student?', !!student);
    const sectionId = student ? student.sectionId : null;
    const typeSafe = 'note';
    const notesSafe = 'test from script';
    const now = new Date().toISOString();
    const replacements = [studentId ?? null, sectionId ?? null, typeSafe ?? null, notesSafe ?? null, now, now];
    console.log('Replacements:', replacements);
    const res = await db.sequelize.query('INSERT INTO FollowUps (student_id, section_id, type, notes, is_open, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?);', { replacements });
    console.log('Insert result:', res);
  } catch (e) {
    console.error('Insert failed:', e && e.errors ? e.errors : e);
    console.error(e.stack);
  }
}
run();