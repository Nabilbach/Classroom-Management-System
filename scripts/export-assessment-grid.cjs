#!/usr/bin/env node
/*
  Usage: node scripts/export-assessment-grid.cjs <sectionId> [cutoffISO]
  Example: node scripts/export-assessment-grid.cjs 3 2025-10-12
  Creates: reports/assessment-grid-section-<id>-<ts>.xlsx
*/
const fs = require('fs');
const path = require('path');
const Excel = require('exceljs');
const db = require('../backend/models');

async function main() {
  const args = process.argv.slice(2);
  if (!args[0]) {
    console.error('Usage: node scripts/export-assessment-grid.cjs <sectionId> [cutoffISO]');
    process.exit(2);
  }
  const sectionId = args[0];
  const cutoff = args[1] ? new Date(args[1]) : null;

  const students = await db.Student.findAll({ where: { sectionId }, attributes: ['id','firstName','lastName','pathwayNumber','classOrder','sectionId'] });
  const studentIds = students.map(s => s.id);
  if (studentIds.length === 0) {
    console.log('No students found in section', sectionId);
    return;
  }

  const assessments = await db.StudentAssessment.findAll({ where: { studentId: studentIds }, order: [['date', 'DESC']] });
  const latestByStudent = {};
  assessments.forEach(a => {
    const ad = new Date(a.date);
    if (cutoff && ad > cutoff) return;
    if (!latestByStudent[a.studentId]) latestByStudent[a.studentId] = a;
  });

  const allKeys = new Set();
  students.forEach(s => {
    const a = latestByStudent[s.id];
    if (a && a.scores) {
      try { const obj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores; Object.keys(obj||{}).forEach(k=>allKeys.add(k)); } catch(e){}
    }
  });
  const keys = Array.from(allKeys);

  const keyMap = { attendance: 'الحضور', attendance_score: 'الحضور', presence: 'الحضور', notebook: 'الدفتر', notebook_score: 'الدفتر', homework: 'الواجب', homework_score: 'الواجب', portfolio_score: 'الملف', behavior: 'السلوك', behavior_score: 'السلوك' };

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('شبكة التقييم');
  // Columns: الرقم (id), الرمز (pathway), الاسم الكامل, الاسم العائلي, الرقم في القسم, تاريخ آخر تقييم, ...elements..., النقطة النهائية
  const headers = ['الرقم', 'الرمز', 'الاسم الكامل', 'الاسم العائلي', 'الرقم في القسم', 'تاريخ آخر تقييم', ...keys.map(k => (keyMap[k] || k.replace(/_/g, ' '))), 'النقطة النهائية (على 20)'];
  sheet.addRow(headers);

  const normalizeTo20 = (v) => {
    if (v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    if (n <= 1) return Math.round(n * 20 * 100) / 100;
    if (n <= 20) return Math.round(n * 100) / 100;
    if (n <= 100) return Math.round((n / 100) * 20 * 100) / 100;
    return Math.round(Math.max(0, Math.min(20, n)) * 100) / 100;
  };

  // Determine per-key maxima (based on latest assessments) and compute scale factor so sum(maxima) == 20
  const maxPerKey = {};
  keys.forEach(k => { maxPerKey[k] = 0; });
  students.forEach(s => {
    const a = latestByStudent[s.id];
    if (!a || !a.scores) return;
    let obj = {};
    try { obj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores; } catch (e) { obj = a.scores || {}; }
    keys.forEach(k => {
      const v = normalizeTo20(obj[k]);
      if (v != null && v > (maxPerKey[k] || 0)) maxPerKey[k] = v;
    });
  });

  const sumMax = keys.reduce((acc, k) => acc + (maxPerKey[k] || 0), 0);
  const scaleFactor = sumMax > 0 ? (20 / sumMax) : 1;

  // Write rows using scaled element values
  students.forEach(s => {
    const a = latestByStudent[s.id];
    let scoresObj = {};
    if (a && a.scores) {
      try { scoresObj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores; } catch (e) { scoresObj = a.scores || {}; }
    }

    const scaled = keys.map(k => {
      const raw = normalizeTo20(scoresObj[k]);
      if (raw == null) return null;
      return Math.round(raw * scaleFactor * 100) / 100;
    });

    const vals = [s.id, s.pathwayNumber ?? s.pathway_number ?? '', `${s.firstName || ''} ${s.lastName || ''}`.trim(), s.lastName || '', s.classOrder ?? s.class_order ?? '', a ? a.date : ''];
    vals.push(...scaled.map(v => (v == null ? '' : v)));
    const nonNullVals = scaled.filter(v => v != null);
    const finalScore = nonNullVals.length ? Math.round(Math.min(20, nonNullVals.reduce((a, b) => a + b, 0)) * 100) / 100 : '';
    vals.push(finalScore);
    sheet.addRow(vals);
  });

  sheet.columns.forEach(col => { col.width = Math.min(30, Math.max(12, (col.header || '').toString().length + 5)); });

  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const out = path.join(reportsDir, `assessment-grid-section-${sectionId}-${ts}.xlsx`);
  await workbook.xlsx.writeFile(out);
  console.log('Wrote', out);
}

main().catch(err=>{ console.error(err); process.exit(2); });
