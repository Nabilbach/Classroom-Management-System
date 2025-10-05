module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define('Section', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    educationalLevel: {
      type: DataTypes.STRING,
      allowNull: true
    }
    ,
    specialization: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  Section.associate = function(models) {
    Section.hasMany(models.Student, { foreignKey: 'sectionId' });
    Section.hasMany(models.Attendance, { foreignKey: 'sectionId' });
  };

  return Section;
};
