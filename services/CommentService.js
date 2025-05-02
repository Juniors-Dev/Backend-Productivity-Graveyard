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
   * Handles deleted states for messages (via model getter) and users.
   * @param {string} projectId
   * @param {Object} pagination
   * @param {number} pagination.limit
   * @param {number} pagination.offset
   * @returns {Promise<Object>} - Object containing comments array and pagination metadata
   */
  async getProjectComments(projectId, { limit, offset }) {
    const projectExists = await this.Project.findByPk(projectId, { attributes: ["id"] });
    if (!projectExists) {
      const error = new Error("Project not found");
      error.status = 404;
      throw error;
    }

    // Fetch comments and their counts
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
    // Convert Sequelize instances to JSON objects
    const rawComments = rows.map((comment) => comment.toJSON());

    return {
      rawComments,
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
    return updatedComment.toJSON();
  }

  /**
   * Soft delete a comment.
   * @param {number} commentId
   * @returns {Promise<boolean>}
   */
  async softDelete(commentId) {
    const comment = await this.Comment.findByPk(commentId);

    if (!comment) {
      const error = new Error("Not found");
      error.status = 404;
      throw error;
    }

    await comment.update({ isDeleted: true, userId: null });
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
