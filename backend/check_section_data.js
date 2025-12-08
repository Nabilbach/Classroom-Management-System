const db = require('./models');

async function checkSectionData() {
  try {
    const sections = await db.Section.findAll({
      include: [{
        model: db.Curriculum,
        as: 'curriculum'
      }]
    });
    
    console.log('--- Section Data Check ---');
    sections.forEach(s => {
      console.log(`ID: ${s.id}, Name: ${s.name}, Specialization: ${s.specialization}, CurriculumID: ${s.curriculumId}, CurriculumTitle: ${s.curriculum ? s.curriculum.title : 'N/A'}`);
    });
    console.log('--------------------------');
    
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkSectionData();
