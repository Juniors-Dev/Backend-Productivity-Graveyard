/**
 * GlobalStat Model
 *
 * Tracks site-wide statistics for all projects.
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const GlobalStat = sequelize.define(
    "GlobalStat",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      totalBuried: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Total number of projects buried",
      },
      averageLifespan: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Average time in days between project startDate and endDate",
      },
      mostCommonCauseOfAbandonment: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      topUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "User with most buried projects",
      },
    },
    {
      timestamps: true,
      tableName: "GlobalStats",
    }
  );

  GlobalStat.associate = (models) => {
    GlobalStat.belongsTo(models.User, {
      foreignKey: "topUserId",
      as: "topUser",
      onDelete: "SET NULL",
    });
  };
  return GlobalStat;
};
