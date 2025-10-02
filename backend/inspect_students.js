const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to DB');

    const sections = await db.Section.findAll({ attributes: ['id', 'name'] });
    const sectionIds = sections.map(s => String(s.id));
    console.log(`Found ${sections.length} sections`);
    for (const s of sections) {
      const count = await db.Student.count({ where: { sectionId: String(s.id) } });
      console.log(`Section ${s.id} (${s.name}): ${count} students`);
    }

    const nullCount = await db.Student.count({ where: { sectionId: null } });
    console.log(`Students with NULL sectionId: ${nullCount}`);

    // students whose sectionId doesn't match any section id
    let mismatches = [];
    if (sectionIds.length > 0) {
      const placeholders = sectionIds.map(() => '?').join(',');
      const [rows] = await db.sequelize.query(`SELECT id, first_name as firstName, last_name as lastName, section_id as sectionId FROM Students WHERE section_id IS NOT NULL AND section_id NOT IN (${placeholders}) LIMIT 50`, { replacements: sectionIds });
      mismatches = rows;
    }

    console.log('Mismatched students (section_id not found in Sections):', mismatches.length);
    if (mismatches.length > 0) console.table(mismatches);

    // Print sample students for first section if exists
    if (sectionIds.length > 0) {
      const sid = sectionIds[0];
      const samples = await db.Student.findAll({ where: { sectionId: sid }, limit: 10 });
      console.log(`Sample students for section ${sid}:`, samples.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, sectionId: s.sectionId })));
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await db.sequelize.close();
  }
})();
