const { Section, TextbookEntry } = require('./models');
const { Op } = require('sequelize');

async function debugLevelFilter() {
  try {
    console.log('🔍 Debugging level filter issue\n');
    
    // Check what's being sent from frontend
    const testLevel = 'أولى باكالوريا';
    console.log(`Testing with level: "${testLevel}"`);
    console.log(`Level length: ${testLevel.length} characters`);
    console.log(`Level bytes:`, Buffer.from(testLevel, 'utf8'));
    
    // Get sections for this level
    console.log('\n1️⃣ Getting sections for أولى باكالوريا:');
    const sections = await Section.findAll({
      where: { educationalLevel: testLevel }
    });
    console.log(`   Found ${sections.length} sections`);
    sections.forEach(s => {
      console.log(`   - ${s.name} (${s.id})`);
    });
    
    if (sections.length === 0) {
      console.log('\n⚠️  No sections found! Checking all sections:');
      const allSections = await Section.findAll();
      allSections.forEach(s => {
        console.log(`   ${s.name}: "${s.educationalLevel}" (${s.educationalLevel?.length || 0} chars)`);
        if (s.educationalLevel) {
          console.log(`      Bytes:`, Buffer.from(s.educationalLevel, 'utf8'));
        }
      });
    }
    
    // Get textbook entries
    const sectionIds = sections.map(s => s.id);
    console.log(`\n2️⃣ Section IDs to search: ${sectionIds.join(', ')}`);
    
    if (sectionIds.length > 0) {
      console.log('\n3️⃣ Getting textbook entries:');
      
      // Test different where conditions
      console.log('\n   Test A: Using Op.in');
      const entriesA = await TextbookEntry.findAll({
        where: { sectionId: { [Op.in]: sectionIds } },
        limit: 5
      });
      console.log(`   Found ${entriesA.length} entries`);
      
      console.log('\n   Test B: Direct sectionId match (first section)');
      if (sectionIds[0]) {
        const entriesB = await TextbookEntry.findAll({
          where: { sectionId: sectionIds[0] },
          limit: 5
        });
        console.log(`   Found ${entriesB.length} entries for section ${sectionIds[0]}`);
        
        // Show sample entries
        if (entriesB.length > 0) {
          console.log('\n   Sample entries:');
          entriesB.forEach(e => {
            console.log(`     - ${e.date}: ${e.sectionName} - ${e.lessonTitle}`);
            console.log(`       sectionId: "${e.sectionId}" (type: ${typeof e.sectionId})`);
          });
        }
      }
      
      // Check all textbook entries to see which sections they reference
      console.log('\n4️⃣ Checking all textbook entries:');
      const allEntries = await TextbookEntry.findAll({
        attributes: ['sectionId', 'sectionName'],
        group: ['sectionId', 'sectionName']
      });
      console.log(`   Unique sections in textbook entries:`);
      allEntries.forEach(e => {
        const matchesLevel = sectionIds.includes(e.sectionId);
        console.log(`     ${e.sectionName} (${e.sectionId}) ${matchesLevel ? '✅' : '❌'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
}

debugLevelFilter();
