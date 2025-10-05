module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    studentId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sectionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    isPresent: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  Attendance.associate = function(models) {
    Attendance.belongsTo(models.Student, { foreignKey: 'studentId' });
    Attendance.belongsTo(models.Section, { foreignKey: 'sectionId' });
  };

  return Attendance;
};
