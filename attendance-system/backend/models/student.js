module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sectionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    classOrder: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  });

  Student.associate = function(models) {
    Student.belongsTo(models.Section, { foreignKey: 'sectionId' });
    Student.hasMany(models.Attendance, { foreignKey: 'studentId' });
  };

  return Student;
};
