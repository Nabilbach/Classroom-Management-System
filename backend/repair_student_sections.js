const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const sequelize = require('./config/database');
const { Student, Section } = require('./models');

/**
 * Repair Students.sectionId by reading separate class Excel files under "لوائح التلاميذ منفصلة".
 * Match students by pathwayNumber (رمز مسار). The filename must include the section name (e.g., "1BACSE-1.xlsx").
 */
async function main() {
  try {
    const baseDir = path.join(__dirname, '..', 'لوائح التلاميذ منفصلة');
    if (!fs.existsSync(baseDir)) {
      console.error('❌ لم يتم العثور على مجلد لوائح التلاميذ منفصلة:', baseDir);
      process.exit(1);
    }

    // Load all sections into a name -> id map
    const sections = await Section.findAll({ attributes: ['id', 'name'] });
    const sectionNameToId = new Map(sections.map(s => [s.name.trim(), s.id]));

  const files = fs.readdirSync(baseDir).filter(f => f.toLowerCase().endsWith('.xlsx'));
    let totalMatched = 0;
    for (const file of files) {
      const full = path.join(baseDir, file);
      const sectionName = path.basename(file, path.extname(file)); // e.g., 1BACSE-1
      let sectionId = sectionNameToId.get(sectionName);
      if (!sectionId) {
        // حاول إنشاء القسم تلقائياً إذا لم يوجد
        try {
          const created = await Section.create({ id: Date.now().toString(), name: sectionName });
          sectionId = created.id;
          sectionNameToId.set(sectionName, sectionId);
          console.log(`➕ تم إنشاء قسم جديد: ${sectionName} -> ${sectionId}`);
        } catch (e) {
          console.warn(`⚠️ لم يتم العثور/إنشاء قسم مطابق لاسم الملف: ${file} (sectionName=${sectionName}) - ${e.message}`);
          continue;
        }
      }

      const wb = xlsx.readFile(full);
      const firstSheet = wb.SheetNames[0];
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[firstSheet], { defval: '' });

      // Try to find a column for pathway number
      const headerKeys = Object.keys(rows[0] || {});
      const keyCandidates = ['pathwayNumber', 'pathway_number', 'رقم مسار', 'مسار', 'رمز مسار', 'رمزمسار', 'code_massar', 'CodeMassar'];
      let key = headerKeys.find(k => keyCandidates.some(c => k.toLowerCase().includes(String(c).toLowerCase())));
      // Heuristic fallback: find the column with most values matching Massar-like pattern (A/P followed by 9-12 digits)
      if (!key) {
        const massarRegex = /^[AP][0-9]{6,12}$/i;
        let best = { k: null, score: -1 };
        for (const k of headerKeys) {
          let score = 0;
          for (const r of rows) {
            const v = String(r[k] ?? '').trim();
            if (massarRegex.test(v)) score++;
          }
          if (score > best.score) best = { k, score };
        }
        if (best.score > 0) key = best.k;
      }
      if (!key) {
        console.warn(`⚠️ تعذر إيجاد عمود رمز مسار في الملف: ${file}`);
        continue;
      }

      // Collect pathway numbers
      const pns = new Set();
      for (const r of rows) {
        const v = String(r[key] || '').trim();
        if (v) pns.add(v);
      }
      if (pns.size === 0) {
        console.warn(`⚠️ لا توجد أرقام مسار صالحة في الملف: ${file}`);
        continue;
      }

      // Update students in batches
      const chunk = 200;
      const pnList = Array.from(pns);
      let matched = 0;
      for (let i = 0; i < pnList.length; i += chunk) {
        const slice = pnList.slice(i, i + chunk);
        const [updatedCount] = await Student.update(
          { sectionId },
          { where: { pathwayNumber: slice } }
        );
        matched += updatedCount;
      }

      totalMatched += matched;
      console.log(`✅ تم تحديث ${matched} تلميذ(ة) للقسم ${sectionName} -> ${sectionId}`);
    }

    // Report summary
    const total = await Student.count();
    const nullCount = await Student.count({ where: { sectionId: null } });
    console.log(`\n📊 ملخص: ${totalMatched} تم ربطهم بالأقسام.\nالإجمالي: ${total} | بدون قسم: ${nullCount}`);
  } catch (e) {
    console.error('❌ خطأ أثناء الإصلاح:', e.message);
  } finally {
    await sequelize.close();
  }
}

main();
