const { Op } = require("sequelize");
const createError = require("../utilities/createError");
class CommentService {
  constructor(db) {
    this.client = db.sequelize;
    this.Comment = db.Comment;
    this.User = db.User;
  }

  async createComment({ projectId, userId, message, parentId = null }) {
    const transaction = await this.client.transaction();

    try {
      let threadId = null;

      //if this is a reply, find parent comment to set threadId
      if (parentId) {
        const parentComment = await this.Comment.findByPk(parentId, { transaction });
        if (!parentComment) {
          throw createError({
            message: "Parent comment not found",
            statusCode: 404,
            errors: { parentId },
          });
        }

        if (parentComment.projectId !== projectId) {
          throw createError({
            message: "Parent comment belongs to a different project",
            statusCode: 400,
            errors: { parentId },
          });
        }

        threadId = parentComment.threadId || parentComment.id;
      }

      const newComment = await this.Comment.create(
        {
          projectId,
          userId,
          message,
          parentId,
          threadId,
        },
        { transaction }
      );

      //If root comment, set threadId to its own id
      if (!parentId) {
        await newComment.update({ threadId: newComment.id }, { transaction });
      }

      await transaction.commit();
      return this.getOneWithDetails(newComment.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getRootComments(projectId, { limit, offset }) {
    const { count, rows: rootComments } = await this.Comment.findAndCountAll({
      where: {
        projectId,
        parentId: null,
      },
      include: [
        {
          model: this.User,
          as: "User",
          attributes: ["id", "username", "avatarUrl"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    if (rootComments.length === 0) {
      return { count: 0, rows: [] };
    }

    // Get all replies for these root comments in 1 query
    const rootCommentIds = rootComments.map((c) => c.id);

    const allReplies = await this.Comment.findAll({
      where: {
        threadId: { [Op.in]: rootCommentIds },
        parentId: { [Op.not]: null },
      },
      include: [
        {
          model: this.User,
          as: "User",
          attributes: ["id", "username", "avatarUrl"],
          required: false,
        },
        {
          model: this.Comment,
          as: "parent",
          attributes: ["id", "message"],
          include: [
            {
              model: this.User,
              as: "User",
              attributes: ["username"],
            },
          ],
          required: false,
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const repliesByThread = new Map();
    allReplies.forEach((reply) => {
      const threadId = reply.threadId || reply.parentId;
      if (!repliesByThread.has(threadId)) {
        repliesByThread.set(threadId, []);
      }
      repliesByThread.get(threadId).push(reply.toJSON());
    });

    const commentsWithReplies = rootComments.map((comment) => ({
      ...comment.toJSON(),
      replyCount: repliesByThread.get(comment.id)?.length || 0,
      replyPreview: repliesByThread.get(comment.id)?.slice(0, 2) || [],
    }));

    return {
      count: count,
      rows: commentsWithReplies,
    };
  }

  async getCommentReplies(commentId, { limit, offset }) {
    const comment = await this.Comment.findByPk(commentId);
    if (!comment) {
      throw createError({
        message: "Comment not found",
        statusCode: 404,
      });
    }

    const threadId = comment.threadId || comment.id;

    const { count, rows } = await this.Comment.findAndCountAll({
      where: {
        threadId,
        parentId: { [Op.not]: null },
      },
      include: [
        {
          model: this.User,
          as: "User",
          attributes: ["id", "username", "avatarUrl"],
          required: false,
        },
        {
          model: this.Comment,
          as: "parent",
          attributes: ["id", "message"],
          include: [
            {
              model: this.User,
              as: "User",
              attributes: ["username"],
            },
          ],
          required: false,
        },
      ],
      order: [["createdAt", "ASC"]],
      limit,
      offset,
    });

    return { count, rows: rows.map((r) => r.toJSON()) };
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

  //message content is now permanently destroyed on delete
  // Consider TODO: moderator/admin path (raw: true query) in a future branch.
  async softDelete(commentId) {
    const updated = await this.Comment.update(
      {
        isDeleted: true,
        userId: null,
        message: "[deleted]",
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
