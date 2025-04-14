/**
 * CauseOfResurrection Model
 *
 * Optional feature.
 * Tracks when a project has been revived after being "buried".
 *
 * @note Currently uses Sequelize's paranoid (soft-delete) feature.
 * @question Do we want soft-deletion here to preserve the resurrection history even if
 * a resurrection record is "deleted" by a user? Might be useful for maintaining
 * the complete lifecycle history of projects that have gone through multiple
 * resurrection attempts?
 *
 * @note No unique constraint on projectId, assuming a project might be
 * buried and resurrected multiple times.
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
        allowNull: true, // Only set if a resurrected project is buried again
      },
      resurrectedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      tableName: "CausesOfResurrection",
      paranoid: true,
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
