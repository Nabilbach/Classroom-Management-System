(async () => {
  try {
    const db = require('./models');
    await db.sequelize.authenticate();
    
    console.log('\n=== Updating TextbookEntry Section Names ===\n');
    
    // Get all textbook entries
    const entries = await db.TextbookEntry.findAll();
    console.log(`Found ${entries.length} textbook entries to check\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const entry of entries) {
      const sectionId = entry.sectionId;
      const currentName = entry.sectionName;
      
      // Check if current name looks like an ID (all digits)
      if (/^\d+$/.test(currentName)) {
        try {
          // Fetch the actual section
          const section = await db.Section.findByPk(sectionId);
          if (section && section.name) {
            // Update with real name
            await entry.update({ sectionName: section.name });
            console.log(`✅ Updated: ${sectionId} -> ${section.name}`);
            updated++;
          } else {
            console.log(`⚠️  Section not found for ID: ${sectionId}`);
            skipped++;
          }
        } catch (e) {
          console.error(`❌ Error updating entry ${entry.id}:`, e.message);
          skipped++;
        }
      } else {
        // Already has a proper name
        skipped++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total: ${entries.length}`);
    
    process.exit(0);
  } catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
  }
})();
