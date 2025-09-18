const sequelize = require('./config/database');
const sequelize = require('./config/database');

async function inspectStudentSchema() {
  try {
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully.');

    const describe = await sequelize.getQueryInterface().describeTable('Students');
    console.log('Student table schema:', describe);

  } catch (error) {
    console.error('Unable to connect to the database or describe table:', error);
  } finally {
    await sequelize.close();
  }
}

inspectStudentSchema();