"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Users').catch(() => null);
    if (table && !table.subject) {
      await queryInterface.addColumn('Users', 'subject', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Users').catch(() => null);
    if (table && table.subject) {
      await queryInterface.removeColumn('Users', 'subject');
    }
  }
};
