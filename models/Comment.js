/**
 * Comment Model
 *
 * Stores user comments on projects, with support-ish for threaded replies.
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
        allowNull: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue("message");
          return this.getDataValue("isDeleted") ? "[deleted]" : rawValue;
        },
      },
      parentId: {
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
      indexes: [
        {
          fields: ["projectId"],
        },
        {
          fields: ["parentId"],
        },
      ],
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
    // Threaded replies
    Comment.belongsTo(models.Comment, {
      foreignKey: "parentId",
      as: "parent",
      constraints: true,
    });
    Comment.hasMany(models.Comment, {
      foreignKey: "parentId",
      as: "replies",
      constraints: true,
    });
  };
  return Comment;
};
