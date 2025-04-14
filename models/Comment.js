/**
 * Comment Model
 *
 * Stores user comments on projects, with support-ish for threaded replies.
 * Uses custom `isDeleted` flag so that deleted comments/users can still show up (e.g. "[deleted]")
 * and keep their reply structure intact.
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Comment = sequelize.define(
    "Comment",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true, // Allows for soft deletion
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT, // NOTE: Diagram says STRING. Use TEXT for lengthy comments
        allowNull: false,
      },
      parentID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Self-reference to parent comment for threading (if this is a reply)",
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Marks the comment as deleted while preserving its structure and replies",
      },
    },
    {
      timestamps: true,
      tableName: "Comments",
      // TODO: Consider adding an index on isDeleted, projectId etc. for faster queries
    }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "SET NULL",
    });
    Comment.belongsTo(models.Project, {
      foreignKey: "projectId",
      onDelete: "CASCADE",
    });
    // Threaded replies (self-referential relationship)
    Comment.belongsTo(models.Comment, {
      foreignKey: "parentID",
      as: "parent",
      constraints: true,
    });
    Comment.hasMany(models.Comment, {
      foreignKey: "parentID",
      as: "replies",
      constraints: true,
    });
  };
  return Comment;
};
