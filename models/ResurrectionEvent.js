/**
 * Tracks when a project has been revived after being "buried".
 */
module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const ResurrectionEvent = sequelize.define(
    "ResurrectionEvent",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      buriedAgain: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resurrectedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      tableName: "ResurrectionEvents",
    }
  );

  ResurrectionEvent.associate = (models) => {
    ResurrectionEvent.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
      onDelete: "CASCADE",
    });
  };
  return ResurrectionEvent;
};
