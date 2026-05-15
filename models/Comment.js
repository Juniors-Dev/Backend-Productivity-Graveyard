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
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Parent comment for replies (null for root comments)",
      },
      threadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Root comment ID for thread grouping",
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
        { fields: ["parentId"] },
        { fields: ["projectId", "parentId"] },
        { fields: ["threadId"] },
        {
          fields: ["threadId", "createdAt"],
          where: { parentId: { [Sequelize.Op.not]: null } },
          name: "comments_thread_replies_idx",
        },
      ],
    }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.User, {
      foreignKey: "userId",
      as: "User",
      onDelete: "SET NULL",
    });
    Comment.belongsTo(models.Project, {
      foreignKey: "projectId",
      onDelete: "CASCADE",
    });
    Comment.belongsTo(models.Comment, {
      foreignKey: "parentId",
      as: "parent",
      constraints: true,
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
    Comment.belongsTo(models.Comment, {
      foreignKey: "threadId",
      as: "thread",
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
    Comment.hasMany(models.Comment, {
      foreignKey: "parentId",
      as: "replies",
      constraints: true,
    });
    Comment.hasMany(models.Comment, {
      foreignKey: "threadId",
      as: "threadReplies",
    });
  };
  return Comment;
};
