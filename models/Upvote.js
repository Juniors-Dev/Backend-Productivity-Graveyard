/**
 * Upvote Model
 *
 * Records a user's upvote on a project.
 * Each user can only upvote a project once.
 * Upvotes are maintained even if the user is deleted.
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Upvote = sequelize.define(
    "Upvote",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "Upvotes",
      indexes: [
        {
          name: "upvote_user_project_unique",
          unique: true,
          fields: ["userId", "projectId"],
        },
      ],
    }
  );

  Upvote.associate = (models) => {
    Upvote.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    Upvote.belongsTo(models.Project, {
      foreignKey: "projectId",
      onDelete: "CASCADE",
    });
  };
  return Upvote;
};
