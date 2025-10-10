const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./models');

const SRC_DB = path.join(__dirname, '..', 'classroom_dev.db');
const TARGET_DB = path.join(__dirname, '..', 'classroom.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function backupTarget() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(BACKUP_DIR, `classroom.db.merge-backup.${ts}.bak`);
  fs.copyFileSync(TARGET_DB, dest);
  console.log('Backed up target DB to', dest);
}

async function run() {
  await backupTarget();

  const src = new Sequelize({ dialect: 'sqlite', storage: SRC_DB, logging: false });
  try {
    await src.authenticate();
  } catch (e) {
    console.error('Failed to open source DB', e.message);
    process.exit(1);
  }

  // Load students mapping
  const [srcStudents] = await src.query('SELECT id, pathway_number, first_name, last_name, section_id FROM Students');
  const tgtStudents = await db.Student.findAll({ raw: true });

  const tgtByPathway = {};
  const tgtByNameAndSection = {};
  for (const t of tgtStudents) {
    if (t.pathwayNumber) tgtByPathway[String(t.pathwayNumber).trim()] = t.id;
    const key = `${String(t.firstName||'').trim().toLowerCase()}|${String(t.lastName||'').trim().toLowerCase()}|${String(t.sectionId||'')}`;
    if (!tgtByNameAndSection[key]) tgtByNameAndSection[key] = t.id;
  }

  const mapSrcToTgt = new Map();
  for (const s of srcStudents) {
    const pathway = s.pathway_number ? String(s.pathway_number).trim() : null;
    let mapped = null;
    if (pathway && tgtByPathway[pathway]) mapped = tgtByPathway[pathway];
    if (!mapped) {
      const key = `${String(s.first_name||'').trim().toLowerCase()}|${String(s.last_name||'').trim().toLowerCase()}|${String(s.section_id||'')}`;
      if (tgtByNameAndSection[key]) mapped = tgtByNameAndSection[key];
    }
    if (mapped) mapSrcToTgt.set(s.id, mapped);
  }

  console.log('Mapped', mapSrcToTgt.size, 'students from source to target by pathway/name+section');

  // Merge Attendances
  const [attRows] = await src.query('SELECT id, studentId, sectionId, date, isPresent, createdAt, updatedAt FROM Attendances');
  let insertedAttend = 0;
  for (const a of attRows) {
    const mappedStudentId = mapSrcToTgt.get(a.studentId);
    if (!mappedStudentId) continue; // cannot map
    // check duplicate in target
    const exists = await db.Attendance.findOne({ where: { studentId: mappedStudentId, date: a.date } });
    if (!exists) {
      await db.Attendance.create({ studentId: mappedStudentId, sectionId: a.sectionId, date: a.date, isPresent: a.isPresent ? 1 : 0, createdAt: a.createdAt, updatedAt: a.updatedAt });
      insertedAttend++;
    }
  }

  // Merge FollowUps
  let insertedFollowups = 0;
  try {
    const [fuRows] = await src.query('SELECT id, student_id, section_id, type, notes, is_open, createdAt, updatedAt FROM FollowUps');
    for (const f of fuRows) {
      const mappedStudentId = mapSrcToTgt.get(f.student_id);
      if (!mappedStudentId) continue;
      // avoid duplicates: same student, type, notes, createdAt
      const exists = await db.sequelize.query('SELECT COUNT(1) as c FROM FollowUps WHERE student_id = ? AND type = ? AND notes = ? AND createdAt = ?', { replacements: [mappedStudentId, f.type, f.notes, f.createdAt], type: db.sequelize.QueryTypes.SELECT });
      const c = Array.isArray(exists) && exists[0] ? Number(exists[0].c || 0) : 0;
      if (c === 0) {
        await db.sequelize.query('INSERT INTO FollowUps (student_id, section_id, type, notes, is_open, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)', { replacements: [mappedStudentId, f.section_id, f.type, f.notes, f.is_open ? 1 : 0, f.createdAt, f.updatedAt] });
        insertedFollowups++;
      }
    }
  } catch (e) {
    console.warn('FollowUps table missing or error:', e.message);
  }

  // Merge StudentAssessments
  let insertedAssessments = 0;
  try {
    const [saRows] = await src.query('SELECT id, studentId, date, old_score, new_score, score_change, notes, scores, createdAt, updatedAt FROM StudentAssessments');
    for (const s of saRows) {
      const mappedStudentId = mapSrcToTgt.get(s.studentId);
      if (!mappedStudentId) continue;
      const exists = await db.StudentAssessment.findOne({ where: { studentId: mappedStudentId, date: s.date, new_score: s.new_score } });
      if (!exists) {
        await db.StudentAssessment.create({ studentId: mappedStudentId, date: s.date, old_score: s.old_score, new_score: s.new_score, score_change: s.score_change, notes: s.notes, scores: s.scores, createdAt: s.createdAt, updatedAt: s.updatedAt });
        insertedAssessments++;
      }
    }
  } catch (e) {
    console.warn('StudentAssessments table missing or error:', e.message);
  }

  console.log(`Inserted attendances: ${insertedAttend}, followups: ${insertedFollowups}, assessments: ${insertedAssessments}`);

  await src.close();
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
