module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'teacher'
    }
  });

  User.associate = function(models) {
    User.belongsToMany(models.Section, {
      through: 'TeacherSections',
      foreignKey: 'teacherId'
    });
  };

  return User;
};
