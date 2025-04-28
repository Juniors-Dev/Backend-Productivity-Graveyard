class CommentService {
  constructor(db) {
    this.client = db.sequelize;
    this.Comment = db.Comment;
    this.Project = db.Project;
    this.User = db.User;
  }

  /**
   * Create new comment or reply.
   * @param {Object} params
   * @param {string} params.projectId
   * @param {string} params.userId
   * @param {string} params.message
   * @param {number} [params.parentId]
   * @returns {Promise<Comment>}
   */
  async create({ projectId, userId, message, parentId = null }) {
    const projectExists = await this.Project.findByPk(projectId, { attributes: ["id"] });
    if (!projectExists) {
      const error = new Error("Project not found");
      error.status = 404;
      throw error;
    }

    if (parentId) {
      const parentComment = await this.Comment.findByPk(parentId, { attributes: ["id", "projectId"] });
      if (!parentComment) {
        const error = new Error("Parent comment not found");
        error.status = 404;
        throw error;
      }
      if (parentComment.projectId !== projectId) {
        const error = new Error("Parent comment does not belong to this project");
        error.status = 400;
        throw error;
      }
    }

    return this.Comment.create({
      projectId,
      userId,
      message,
      parentId,
    });
  }

  /**
   * Get top-level comments for a project with pagination.
   * @param {string} projectId
   * @param {Object} pagination
   * @param {number} pagination.limit
   * @param {number} pagination.offset
   * @returns {Promise<Object>}
   */
  async getProjectComments(projectId, { limit, offset }) {
    const projectExists = await this.Project.findByPk(projectId, { attributes: ["id"] });
    if (!projectExists) {
      const error = new Error("Project not found");
      error.status = 404;
      throw error;
    }

    const { count, rows } = await this.Comment.findAndCountAll({
      where: {
        projectId,
        parentId: null,
      },
      include: [
        {
          model: this.User,
          attributes: ["id", "username", "avatarUrl"],
        },
        {
          model: this.Comment,
          as: "replies",
          include: [
            {
              model: this.User,
              attributes: ["id", "username", "avatarUrl"],
            },
          ],
          separate: true,
          order: [["createdAt", "ASC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const processedComments = rows.map((comment) => {
      const commentJSON = comment.toJSON();
      const user = commentJSON.isDeleted ? null : commentJSON.User;

      const processedReplies = (commentJSON.replies || []).map((reply) => {
        const replyUser = reply.isDeleted ? null : reply.User;
        return {
          ...reply,
          User: replyUser,
          edited: !reply.isDeleted && reply.createdAt.getTime() !== reply.updatedAt.getTime(),
        };
      });

      return {
        ...commentJSON,
        User: user,
        replies: processedReplies,
        edited: !commentJSON.isDeleted && commentJSON.createdAt.getTime() !== commentJSON.updatedAt.getTime(),
      };
    });

    return {
      comments: processedComments,
      totalCount: count,
      limit,
      offset,
    };
  }

  /**
   * Update a comment's message.
   * @param {number} commentId
   * @param {string} message
   * @returns {Promise<Object|null>}
   */
  async update(commentId, message) {
    const comment = await this.Comment.findByPk(commentId);

    if (!comment) {
      const error = new Error("Comment not found");
      error.status = 404;
      throw error;
    }

    if (comment.isDeleted) {
      const error = new Error("Cannot update a deleted comment");
      error.status = 400;
      throw error;
    }

    await comment.update({ message });

    const updatedComment = await this.Comment.findByPk(commentId, {
      include: [
        {
          model: this.User,
          attributes: ["id", "username", "avatarUrl"],
        },
        {
          model: this.Comment,
          as: "replies",
          include: [
            {
              model: this.User,
              attributes: ["id", "username", "avatarUrl"],
            },
          ],
          separate: true,
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    const commentJSON = updatedComment.toJSON();
    return {
      ...commentJSON,
      edited: commentJSON.createdAt.getTime() !== commentJSON.updatedAt.getTime(),
      replies: commentJSON.replies.map((reply) => ({
        ...reply,
        edited: reply.createdAt.getTime() !== reply.updatedAt.getTime(),
      })),
    };
  }

  /**
   * Soft delete a comment.
   * @param {number} commentId
   * @returns {Promise<boolean>}
   */
  async softDelete(commentId) {
    const comment = await this.Comment.findByPk(commentId);

    if (!comment) {
      const error = new Error("Comment not found");
      error.status = 404;
      throw error;
    }

    await comment.update({ isDeleted: true });
    return true;
  }

  /**
   * Get a comment by ID (for ownership checking)
   * @param {number} commentId
   * @returns {Promise<Comment|null>}
   */
  async getOneId(commentId) {
    return this.Comment.findByPk(commentId);
  }
}

module.exports = CommentService;
