const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

(async () => {
  try {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const files = fs.readdirSync(repoRoot);
    const dbFiles = files.filter(f => f.endsWith('.db'));

    console.log('Found DB files:', dbFiles);

    for (const dbFile of dbFiles) {
      const dbPath = path.join(repoRoot, dbFile);
      const stats = fs.statSync(dbPath);
      console.log('\n===', dbFile, '===');
      console.log('Path:', dbPath);
      console.log('Size (bytes):', stats.size);
      console.log('Modified:', stats.mtime.toISOString());

      const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false,
      });

      try {
        // Check if AdminScheduleEntries table exists
        const tables = await sequelize.getQueryInterface().showAllTables();
        const hasAdmin = tables.includes('AdminScheduleEntries') || tables.includes('adminscheduleentries') || tables.includes('adminScheduleEntries');
        console.log('Has AdminScheduleEntries table?', hasAdmin);
        if (!hasAdmin) {
          await sequelize.close();
          continue;
        }

        const [results] = await sequelize.query(`SELECT id, day, startTime, duration, sectionId, createdAt FROM AdminScheduleEntries ORDER BY datetime(createdAt) DESC LIMIT 50;`);
        console.log('AdminScheduleEntries (latest up to 50):', results.length);
        for (const r of results) {
          console.log(JSON.stringify(r));
        }
      } catch (e) {
        console.warn('Failed to query admin schedule for', dbFile, e.message || e);
      } finally {
        try { await sequelize.close(); } catch {}
      }
    }
  } catch (err) {
    console.error('Error inspecting DBs:', err);
    process.exit(1);
  }
})();
