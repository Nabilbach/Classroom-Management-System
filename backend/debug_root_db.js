const { Sequelize } = require('sequelize');
const path = require('path');

// Point to the ROOT classroom.db (1.1MB file)
// __dirname is backend/
const dbPath = path.join(__dirname, '..', 'classroom.db');
console.log('Checking database at:', dbPath);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('Connection successful.');

        const [students] = await sequelize.query("SELECT COUNT(*) as count FROM Students");
        console.log('Students count:', students[0].count);

        const [sections] = await sequelize.query("SELECT COUNT(*) as count FROM Sections");
        console.log('Sections count:', sections[0].count);

        const [lessons] = await sequelize.query("SELECT COUNT(*) as count FROM Lessons");
        console.log('Lessons count:', lessons[0].count);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkData();
