/**
 * UserAchievement Model
 *
 * Part of optional feature.
 *
 * Junction table for User.js and Achievement.js.
 * Records when a user earns an achievement and prevents duplicate achievements.
 *
 * @note  Removed ID field — using a composite primary key [userId + achievementId] instead.
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const UserAchievement = sequelize.define(
    "UserAchievement",
    {
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
          onDelete: "CASCADE",
        },
      },
      achievementId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Achievements",
          key: "id",
          onDelete: "CASCADE",
        },
      },
      earnedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      tableName: "UserAchievements",
      indexes: [
        {
          name: "user_achievement_unique",
          unique: true,
          fields: ["userId", "achievementId"],
        },
      ],
    }
  );
  return UserAchievement;
};
