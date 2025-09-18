const { DataTypes } = require('sequelize');
const sequelize = require('./config/database');
const Section = require('./models/section');
const AdministrativeTimetableEntry = require('./models/administrativeTimetableEntry');

const migrate = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    // Add sectionId column if it doesn't exist
    const tableDescription = await queryInterface.describeTable('administrative_timetable');
    if (!tableDescription.sectionId) {
        await queryInterface.addColumn('administrative_timetable', 'sectionId', {
          type: DataTypes.STRING,
          allowNull: true, // Allow null temporarily
        });
    }

    // Get all sections and create a map of name to id
    const sections = await Section.findAll();
    const sectionMap = new Map();
    sections.forEach(section => {
      sectionMap.set(section.name, section.id);
    });

    // Get all timetable entries
    const timetableEntries = await AdministrativeTimetableEntry.findAll();

    // Update sectionId for each entry
    for (const entry of timetableEntries) {
      const sectionId = sectionMap.get(entry.sectionName);
      if (sectionId) {
        await entry.update({ sectionId });
      }
    }

    // Delete orphaned entries
    await AdministrativeTimetableEntry.destroy({
      where: {
        sectionId: null
      }
    });

    // Make sectionId not nullable
    await queryInterface.changeColumn('administrative_timetable', 'sectionId', {
      type: DataTypes.STRING,
      allowNull: false,
    });

    // Remove sectionName column
    await queryInterface.removeColumn('administrative_timetable', 'sectionName');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
};

migrate();