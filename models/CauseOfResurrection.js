/**
 * CauseOfResurrection Model
 *
 * Optional feature.
 * Tracks when a project has been revived after being "buried".
 *
 * @note No unique constraint on projectId, assuming a project might be
 * buried and resurrected multiple times.
 * @question Change model name to something more descriptive? (eg. ResurrectionEvent)
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const CauseOfResurrection = sequelize.define(
    "CauseOfResurrection",
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
      // QUESTION: What does name represent here?
      name: {
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
        // QUESTION: would this end up being the same as createdAt from timestamp?
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      tableName: "CausesOfResurrection",
    }
  );

  CauseOfResurrection.associate = (models) => {
    CauseOfResurrection.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
      onDelete: "CASCADE",
    });
  };
  return CauseOfResurrection;
};
