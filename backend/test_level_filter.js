const { Section, TextbookEntry } = require('./models');
const { Op } = require('sequelize');

async function testLevelFilter() {
  try {
    console.log('🧪 Testing level filter functionality\n');
    
    // Test 1: Get all sections by level
    console.log('Test 1: Getting sections by educational level');
    console.log('═'.repeat(60));
    
    for (const level of ['جذع مشترك', 'أولى باكالوريا']) {
      const sections = await Section.findAll({
        where: { educationalLevel: level },
        attributes: ['id', 'name', 'educationalLevel']
      });
      
      console.log(`\n${level}:`);
      console.log(`  Found ${sections.length} sections`);
      sections.forEach(s => {
        console.log(`    - ${s.name} (${s.id})`);
      });
    }
    
    // Test 2: Get textbook entries by level
    console.log('\n\nTest 2: Getting textbook entries by educational level');
    console.log('═'.repeat(60));
    
    for (const level of ['جذع مشترك', 'أولى باكالوريا']) {
      const sectionsForLevel = await Section.findAll({
        where: { educationalLevel: level },
        attributes: ['id']
      });
      const sectionIds = sectionsForLevel.map(s => s.id);
      
      console.log(`\n${level}:`);
      console.log(`  Section IDs: ${sectionIds.join(', ')}`);
      
      if (sectionIds.length > 0) {
        const entries = await TextbookEntry.findAll({
          where: { sectionId: { [Op.in]: sectionIds } },
          attributes: ['id', 'sectionName', 'lessonTitle', 'date']
        });
        
        console.log(`  Found ${entries.length} textbook entries`);
        if (entries.length > 0) {
          console.log('  Sample entries:');
          entries.slice(0, 3).forEach(e => {
            console.log(`    - ${e.date}: ${e.sectionName} - ${e.lessonTitle}`);
          });
        }
      }
    }
    
    console.log('\n\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLevelFilter();
