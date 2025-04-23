/**
 * Project Model
 *
 * Represents a user-submitted project in the graveyard.
 * @note Linked to ProjectTags for category (Type) tagging.
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "The title/name of the project",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      eulogy: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      causeOfDeath: {
        type: DataTypes.STRING,
        comment: "Brief description of why the project was abandoned",
      },
      tombstoneId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "When the project was started",
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "When the project was abandoned",
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "buried",
        validate: { isIn: [["inactive", "active", "buried", "resurrected", "completed", "archived"]] },
      },
    },
    {
      timestamps: true,
      tableName: "Projects",
    }
  );

  Project.associate = (models) => {
    Project.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    Project.belongsTo(models.Tombstone, {
      foreignKey: "tombstoneId",
      onDelete: "SET NULL",
    });
    Project.hasMany(models.ResurrectionEvent, {
      foreignKey: "projectId",
      as: "resurrections",
      onDelete: "CASCADE",
    });
    Project.hasMany(models.Comment, {
      foreignKey: "projectId",
      onDelete: "CASCADE",
    });
    Project.hasMany(models.Upvote, {
      foreignKey: "projectId",
      onDelete: "CASCADE",
    });
    Project.belongsToMany(models.Type, {
      through: "ProjectTags",
      foreignKey: "projectId",
      otherKey: "typeId",
      as: "types",
      onDelete: "CASCADE",
    });
  };
  return Project;
};
