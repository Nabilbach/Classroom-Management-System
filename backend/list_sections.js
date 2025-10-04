const { Section } = require('./models');

async function listSections() {
  try {
    console.log('📋 Listing all sections:\n');
    
    const sections = await Section.findAll({
      order: [['name', 'ASC']]
    });
    
    console.log('ID\t\tName\t\tEducational Level');
    console.log('─'.repeat(70));
    
    sections.forEach(section => {
      console.log(`${section.id}\t\t${section.name}\t\t${section.educationalLevel || 'Not set'}`);
    });
    
    console.log('\n' + '─'.repeat(70));
    console.log(`Total sections: ${sections.length}`);
    
    // Group by level
    const grouped = {};
    sections.forEach(section => {
      const level = section.educationalLevel || 'Not set';
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(section.name);
    });
    
    console.log('\n📊 Sections by educational level:');
    Object.keys(grouped).forEach(level => {
      console.log(`\n${level}:`);
      grouped[level].forEach(name => console.log(`  - ${name}`));
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listSections();
