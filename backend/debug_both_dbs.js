const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const rootDbPath = path.join(__dirname, '..', 'classroom.db');
const backendDbPath = path.join(__dirname, 'classroom.db');

console.log('--- Checking ROOT DB ---');
console.log('Path:', rootDbPath);
if (fs.existsSync(rootDbPath)) {
    console.log('Size:', fs.statSync(rootDbPath).size, 'bytes');
    checkDb(rootDbPath, 'ROOT');
} else {
    console.log('File does not exist.');
}

console.log('\n--- Checking BACKEND DB ---');
console.log('Path:', backendDbPath);
if (fs.existsSync(backendDbPath)) {
    console.log('Size:', fs.statSync(backendDbPath).size, 'bytes');
    checkDb(backendDbPath, 'BACKEND');
} else {
    console.log('File does not exist.');
}

async function checkDb(dbPath, label) {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log(`[${label}] Connection successful.`);

        const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
        console.log(`[${label}] Tables:`, tables.map(t => t.name).join(', '));

        if (tables.some(t => t.name === 'Students')) {
            const [students] = await sequelize.query("SELECT COUNT(*) as count FROM Students");
            console.log(`[${label}] Students count:`, students[0].count);
        }
        if (tables.some(t => t.name === 'Sections')) {
            const [sections] = await sequelize.query("SELECT COUNT(*) as count FROM Sections");
            console.log(`[${label}] Sections count:`, sections[0].count);
        }

    } catch (error) {
        console.error(`[${label}] Error:`, error.message);
    } finally {
        await sequelize.close();
    }
}
