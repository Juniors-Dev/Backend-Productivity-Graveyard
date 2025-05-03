module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Achievement = sequelize.define(
    "Achievement",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      requirements: {
        type: DataTypes.TEXT,
      },
      imageUrl: {
        type: DataTypes.STRING,
      },
    },
    {
      timestamps: true,
      tableName: "Achievements",
    }
  );

  Achievement.associate = (models) => {
    Achievement.belongsToMany(models.User, {
      through: "UserAchievements",
      foreignKey: "achievementId",
      otherKey: "userId",
      as: "users",
      onDelete: "CASCADE",
    });
  };
  return Achievement;
};
