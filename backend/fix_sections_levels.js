const { Section } = require('./models');

async function fixSectionsLevels() {
  try {
    console.log('🔄 Fixing sections educational levels...\n');
    
    // Define the correct mapping
    const mappings = [
      { id: '1758447797026', name: '1BACSH-2', level: 'أولى باكالوريا' },
      { id: '1758447797076', name: '1BACSH-3', level: 'أولى باكالوريا' },
      { id: '1758447797354', name: 'TCLSH-1', level: 'جذع مشترك' },
      { id: '1758447797388', name: 'TCLSH-2', level: 'جذع مشترك' },
      { id: '1758447797419', name: 'TCLSH-3', level: 'جذع مشترك' },
      { id: '1758447797455', name: 'TCS-1', level: 'جذع مشترك' },
      { id: '1758447797485', name: 'TCS-2', level: 'جذع مشترك' },
      { id: '1758447797520', name: 'TCS-3', level: 'جذع مشترك' },
      { id: '1758447797548', name: 'TCSF-1', level: 'جذع مشترك' }
    ];
    
    for (const mapping of mappings) {
      const section = await Section.findByPk(mapping.id);
      if (section) {
        await section.update({ educationalLevel: mapping.level });
        console.log(`✅ ${mapping.name} -> ${mapping.level}`);
      } else {
        console.warn(`⚠️  Section not found: ${mapping.name} (${mapping.id})`);
      }
    }
    
    console.log('\n📊 Final Summary:');
    const summary = await Section.findAll({
      attributes: [
        'educationalLevel',
        [Section.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['educationalLevel']
    });
    
    summary.forEach(row => {
      console.log(`   ${row.educationalLevel}: ${row.get('count')} sections`);
    });
    
    console.log('\n✅ All sections updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSectionsLevels();
