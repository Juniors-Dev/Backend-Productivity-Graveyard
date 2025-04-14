/**
 * Project Model
 *
 * Represents a user-submitted project in the graveyard.
 *
 * @note Linked to ProjectTags for category (Type) tagging.
 * @note Each project can have a resurrection (optional), tombstone (optional), comments, and upvotes.
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
        // QUESTION: Is this the eulogy?
        type: DataTypes.TEXT,
        comment: "Project Eulogy",
      },
      causeOfDeath: {
        type: DataTypes.STRING,
        comment: "Brief description of why the project was abandoned",
        // NOTE: consider removing this if we're only using 'Type' tags
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
        allowNull: true,
        comment: "When the project was started",
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When the project was abandoned/buried",
      },
      isWalkingDead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Tags project as Walking Dead if resurrected",
      },
      status: {
        // NOTE: Switched from ENUM (harder to modify later (e.g. adding 'archived') to STRING to avoid Postgres lock-in
        // QUESTION: Then we check the status value with Yup instead of using a strict DB type?
        type: DataTypes.STRING,
        defaultValue: "active",
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
    // Allows resurrection history (multiple entries)
    Project.hasMany(models.CauseOfResurrection, {
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
    // Project can have multiple death types/categories
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
