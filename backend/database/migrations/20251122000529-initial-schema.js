'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Students Table
    await queryInterface.createTable('Students', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: false },
      pathwayNumber: { type: Sequelize.STRING, unique: true },
      registrationNumber: { type: Sequelize.STRING },
      sectionId: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Sections Table
    await queryInterface.createTable('Sections', {
      id: { type: Sequelize.STRING, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      level: { type: Sequelize.STRING },
      specialty: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. Attendances Table
    await queryInterface.createTable('Attendances', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false },
      studentId: { type: Sequelize.INTEGER, references: { model: 'Students', key: 'id' } },
      sectionId: { type: Sequelize.STRING, references: { model: 'Sections', key: 'id' } },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 4. Lessons Table
    await queryInterface.createTable('Lessons', {
      id: { type: Sequelize.STRING, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      courseId: { type: Sequelize.STRING },
      semester: { type: Sequelize.STRING },
      status: { type: Sequelize.STRING, defaultValue: 'planned' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 5. AdministrativeTimetable Table
    await queryInterface.createTable('administrative_timetable', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      day: { type: Sequelize.STRING, allowNull: false },
      startTime: { type: Sequelize.STRING, allowNull: false },
      endTime: { type: Sequelize.STRING, allowNull: false },
      sectionId: { type: Sequelize.STRING, allowNull: false },
      subject: { type: Sequelize.STRING },
      room: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('administrative_timetable');
    await queryInterface.dropTable('Lessons');
    await queryInterface.dropTable('Attendances');
    await queryInterface.dropTable('Sections');
    await queryInterface.dropTable('Students');
  }
};
