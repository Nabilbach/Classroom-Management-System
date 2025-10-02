const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const db = require('../models');

async function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

async function upsert(entries) {
  for (const e of entries) {
    const payload = {
      id: e.id || Date.now().toString(),
      day: e.day,
      startTime: e.startTime,
      duration: e.duration || 1,
      sectionId: e.sectionId || null,
      subject: e.subject || null,
      teacher: e.teacher || null,
      classroom: e.classroom || null,
      sessionType: e.sessionType || 'official'
    };
    const existing = await db.AdminScheduleEntry.findByPk(String(payload.id));
    if (existing) {
      await existing.update(payload);
      console.log('Updated entry', payload.id);
    } else {
      await db.AdminScheduleEntry.create(payload);
      console.log('Created entry', payload.id);
    }
  }
}

(async () => {
  try {
    const args = process.argv.slice(2);
    if (!args[0]) {
      console.error('Usage: node import_admin_schedule.js <path-to-json>');
      process.exit(1);
    }
    const jsonPath = path.resolve(process.cwd(), args[0]);
    if (!fs.existsSync(jsonPath)) {
      console.error('File not found:', jsonPath);
      process.exit(1);
    }
    const entries = await loadJson(jsonPath);
    if (!Array.isArray(entries)) {
      console.error('JSON must be an array of entries');
      process.exit(1);
    }
    await upsert(entries);
    console.log('Import completed');
    process.exit(0);
  } catch (e) {
    console.error('Import failed:', e);
    process.exit(1);
  }
})();
