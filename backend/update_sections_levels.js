const { Section } = require('./models');
const sequelize = require('./config/database');

async function updateSectionsLevels() {
  try {
    console.log('🔄 Starting to update sections educational levels...');
    
    // Get all sections
    const sections = await Section.findAll();
    console.log(`📋 Found ${sections.length} sections`);
    
    // Define educational levels for each section based on name patterns
    // جذع مشترك: 1BACSEF, 1BACSHF, etc. (first year of baccalaureate)
    // أولى باكالوريا: 2BACSEF, 2BACSHF, etc. (second year of baccalaureate)
    
    let updatedCount = 0;
    
    for (const section of sections) {
      let level = null;
      const sectionName = section.name || section.id;
      
      // Check if section name contains indicators
      // 1BAC = First year Baccalaureate = جذع مشترك
      // 2BAC = Second year Baccalaureate = أولى باكالوريا (or ثانية باكالوريا)
      // TC = Tronc Commun = جذع مشترك
      // TCS = Tronc Commun Sciences = جذع مشترك علمي
      // TCSF = Tronc Commun Sciences Français = جذع مشترك علمي فرنسي
      // TCLSH = Tronc Commun Lettres et Sciences Humaines = جذع مشترك آداب
      
      if (sectionName.includes('2BAC')) {
        level = 'أولى باكالوريا';
      } else if (sectionName.includes('1BAC') || 
                 sectionName.startsWith('TC') || 
                 sectionName.startsWith('TCS') ||
                 sectionName.startsWith('TCSF') ||
                 sectionName.startsWith('TCLSH')) {
        level = 'جذع مشترك';
      } else {
        // Try to manually determine based on known patterns
        console.warn(`⚠️  Unknown pattern for section: ${sectionName}`);
        console.log(`   Please specify level manually. Enter 1 for جذع مشترك, 2 for أولى باكالوريا`);
        // Default to جذع مشترك
        level = 'جذع مشترك';
      }
      
      await section.update({ educationalLevel: level });
      console.log(`✅ Updated ${sectionName} -> ${level}`);
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} sections`);
    
    // Show summary
    const summary = await sequelize.query(`
      SELECT educationalLevel, COUNT(*) as count 
      FROM Sections 
      GROUP BY educationalLevel
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('\n📊 Summary by educational level:');
    summary.forEach(row => {
      console.log(`   ${row.educationalLevel}: ${row.count} sections`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating sections:', error);
    process.exit(1);
  }
}

updateSectionsLevels();
