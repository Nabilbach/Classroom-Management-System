const fs = require('fs');
const path = require('path');

const exportsDir = path.join(__dirname, '..', 'tmp_schedule_exports');
if (!fs.existsSync(exportsDir)) {
  console.error('Exports directory not found:', exportsDir);
  process.exit(1);
}

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

const files = fs.readdirSync(exportsDir).filter(f => f.endsWith('.schedule.json'));
if (files.length === 0) {
  console.error('No export files found in', exportsDir);
  process.exit(1);
}

const maps = {};
for (const f of files) {
  const p = path.join(exportsDir, f);
  const data = loadJson(p);
  if (!data) continue;
  const key = f.replace('.schedule.json', '');
  maps[key] = data;
}

const classroomKey = Object.keys(maps).find(k => k.startsWith('classroom_db')) || Object.keys(maps)[0];
console.log('Using', classroomKey, 'as baseline (classroom.db)');

const baseline = maps[classroomKey] || { admin: [], scheduled: [] };

function toId(item, table) {
  if (!item) return null;
  if (table === 'admin') return String(item.id || item.ID || item.Id || JSON.stringify(item));
  if (table === 'scheduled') return String(item.id || item.ID || item.Id || `${item.date}|${item.startTime}|${JSON.stringify(item.assignedSections||item.assigned_sections||[])}`);
  return JSON.stringify(item);
}

const baselineAdminIds = new Set((baseline.admin||[]).map(a => toId(a,'admin')));
const baselineScheduledIds = new Set((baseline.scheduled||[]).map(s => toId(s,'scheduled')));

const summary = [];
for (const [k,v] of Object.entries(maps)) {
  if (k === classroomKey) continue;
  const admin = v.admin || [];
  const scheduled = v.scheduled || [];
  const adminOnly = admin.filter(a => !baselineAdminIds.has(toId(a,'admin')));
  const scheduledOnly = scheduled.filter(s => !baselineScheduledIds.has(toId(s,'scheduled')));
  summary.push({ db: k, adminExtra: adminOnly.length, scheduledExtra: scheduledOnly.length, adminSample: adminOnly.slice(0,3), scheduledSample: scheduledOnly.slice(0,3) });
}

console.log('\nComparison summary (rows present in other DBs but NOT in classroom.db baseline):\n');
for (const s of summary) {
  console.log(`DB: ${s.db}`);
  console.log(`  AdminScheduleEntries unique: ${s.adminExtra}`);
  if (s.adminExtra && s.adminSample) console.log('    Sample admin unique ids:', s.adminSample.map(x => x.id));
  console.log(`  ScheduledLessons unique: ${s.scheduledExtra}`);
  if (s.scheduledExtra && s.scheduledSample) console.log('    Sample scheduled unique ids/dates:', s.scheduledSample.map(x => x.id || x.date));
  console.log('');
}

console.log('Done. If some DBs show unique rows, consider importing them from the corresponding JSON files in this folder.');
