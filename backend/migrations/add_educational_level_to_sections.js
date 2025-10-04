const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

async function up() {
  try {
    // Add educationalLevel column to Sections table
    await sequelize.getQueryInterface().addColumn('Sections', 'educationalLevel', {
      type: DataTypes.STRING,
      allowNull: true // Making it nullable to not break existing data
    });

    // Optionally initialize educationalLevel for existing records
    // This is where you would set default values if needed
    await sequelize.query(`
      UPDATE Sections 
      SET educationalLevel = 'جذع مشترك'
      WHERE educationalLevel IS NULL
    `);

    console.log('✅ Successfully added educationalLevel column to Sections table');
  } catch (error) {
    console.error('❌ Error adding educationalLevel column:', error);
    throw error;
  }
}

async function down() {
  try {
    // Remove educationalLevel column from Sections table
    await sequelize.getQueryInterface().removeColumn('Sections', 'educationalLevel');
    console.log('✅ Successfully removed educationalLevel column from Sections table');
  } catch (error) {
    console.error('❌ Error removing educationalLevel column:', error);
    throw error;
  }
}

module.exports = { up, down };