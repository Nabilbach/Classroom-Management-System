// Script to clean and normalize educationalLevel values in Sections table
const db = require('./models');

const normalize = (s) => {
  if (typeof s !== 'string') return s;
  let t = s.normalize('NFC').replace(/\s+/g, ' ').trim(); // collapse whitespace
  // normalize common spelling variants
  t = t.replace(/باكالوريا/g, 'بكالوريا');
  return t;
};

(async () => {
  try {
    console.log('🔍 Starting educational level cleanup...\n');
    
    const sections = await db.Section.findAll();
    console.log(`Found ${sections.length} sections\n`);
    
    let updated = 0;
    let unchanged = 0;
    
    for (const section of sections) {
      const original = section.educationalLevel;
      const cleaned = normalize(original);
      
      if (original !== cleaned) {
        console.log(`📝 Updating section ${section.name}:`);
        console.log(`   Old: "${original}" (${original ? original.length : 0} chars)`);
        console.log(`   New: "${cleaned}" (${cleaned.length} chars)`);
        await section.update({ educationalLevel: cleaned });
        updated++;
      } else {
        unchanged++;
      }
    }
    
    console.log('\n✅ Cleanup complete:');
    console.log(`   Updated: ${updated} sections`);
    console.log(`   Unchanged: ${unchanged} sections`);
    
    // Show final distribution
    console.log('\n📊 Final distribution:');
    const [results] = await db.sequelize.query(`
      SELECT educationalLevel, COUNT(*) as count 
      FROM Sections 
      WHERE educationalLevel IS NOT NULL
      GROUP BY educationalLevel
      ORDER BY count DESC
    `);
    
    results.forEach(row => {
      console.log(`   ${row.educationalLevel}: ${row.count} sections`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
