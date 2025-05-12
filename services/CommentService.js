class CommentService {
  constructor(db) {
    this.client = db.sequelize;
    this.Comment = db.Comment;
    this.User = db.User;
  }

  async createComment({ projectId, userId, message, parentId = null }) {
    const newComment = await this.Comment.create({
      projectId,
      userId,
      message,
      parentId,
    });

    return this.getOneWithDetails(newComment.id);
  }

  async getProjectComments(projectId, { limit, offset }) {
    const { count, rows } = await this.Comment.findAndCountAll({
      where: { projectId, parentId: null },
      include: [
        { model: this.User, as: "User", attributes: ["id", "username", "avatarUrl"], required: false },
        {
          model: this.Comment,
          as: "replies",
          include: [{ model: this.User, as: "User", attributes: ["id", "username", "avatarUrl"], required: false }],
          separate: true,
          order: [["createdAt", "ASC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    const commentsAsJSON = rows.map((comment) => comment.toJSON());

    return {
      count: count,
      rows: commentsAsJSON,
    };
  }

  async getOneId(commentId) {
    return this.Comment.findByPk(commentId);
  }

  async getOneWithDetails(commentId) {
    const comment = await this.Comment.findByPk(commentId, {
      include: [
        {
          model: this.User,
          as: "User",
          attributes: ["id", "username", "avatarUrl"],
          required: false,
        },
        {
          model: this.Comment,
          as: "replies",
          include: [
            {
              model: this.User,
              as: "User",
              attributes: ["id", "username", "avatarUrl"],
              required: false,
            },
          ],
          separate: true,
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    return comment ? comment.toJSON() : null;
  }

  async updateComment(commentId, message) {
    const updated = await this.Comment.update(
      {
        message,
      },
      {
        where: {
          id: commentId,
          isDeleted: false,
        },
      }
    );
    return updated[0] === 1 ? this.getOneWithDetails(commentId) : null;
  }

  async softDelete(commentId) {
    const updated = await this.Comment.update(
      {
        isDeleted: true,
        userId: null,
      },
      {
        where: {
          id: commentId,
          isDeleted: false,
        },
      }
    );

    return updated[0] === 1;
  }
}

module.exports = CommentService;
