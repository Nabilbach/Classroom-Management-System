require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.development') });
const { Curriculum, CurriculumItem } = require('./models');

async function checkCurriculums() {
  try {
    const curriculums = await Curriculum.findAll({
      include: [{ model: CurriculumItem, as: 'items' }]
    });
    console.log('Curriculums found:', curriculums.length);
    curriculums.forEach(c => {
      console.log(`ID: ${c.id}, Title: ${c.title}, Items: ${c.items.length}`);
    });
  } catch (error) {
    console.error('Error checking curriculums:', error);
  }
}

checkCurriculums();