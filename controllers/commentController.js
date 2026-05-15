const { db } = require("../models");
const CommentService = require("../services/CommentService");
const commentService = new CommentService(db);
const { successResponse } = require("../utilities/response");
const createError = require("../utilities/createError");
const { getLimitOffset } = require("../utilities/getPagination");

async function createComment(req, res) {
  const { message, parentId } = req.body;
  const { projectId } = req.params;
  const { id: userId } = req.user;

  if (parentId) {
    const parentComment = await commentService.getOneId(parentId);

    if (!parentComment) {
      throw createError({
        message: "Parent comment not found",
        statusCode: 404,
        errors: { parentId },
      });
    }
  }

  const newComment = await commentService.createComment({ projectId, userId, message, parentId });

  res.status(201).json(
    successResponse({
      message: "Comment created successfully",
      data: newComment,
      statusCode: 201,
    })
  );
}

async function getProjectComments(req, res) {
  const { projectId } = req.params;
  const { limit, offset } = getLimitOffset(req);

  const { count, rows } = await commentService.getRootComments(projectId, { limit, offset });

  res.status(200).json(
    successResponse({
      message: "Comments retrieved successfully",
      data: rows,
      meta: {
        total: count,
        limit,
        offset,
        hasNext: offset + limit < count,
      },
      statusCode: 200,
    })
  );
}

async function getCommentReplies(req, res) {
  const { id } = req.params;
  const { limit, offset } = getLimitOffset(req);

  const { count, rows } = await commentService.getCommentReplies(id, { limit, offset });

  res.status(200).json(
    successResponse({
      message: "Replies retrieved successfully",
      data: rows,
      meta: {
        total: count,
        limit,
        offset,
        hasNext: offset + limit < count,
      },
    })
  );
}

async function updateComment(req, res) {
  const { id } = req.params;
  const { message } = req.body;

  const comment = await commentService.getOneId(id);

  if (!comment) {
    throw createError({
      message: "Comment not found",
      statusCode: 404,
      errors: { commentId: id },
    });
  }

  const updatedComment = await commentService.updateComment(id, message);

  res.status(200).json(
    successResponse({
      message: "Comment updated successfully",
      data: updatedComment,
      statusCode: 200,
    })
  );
}

async function deleteComment(req, res) {
  const { id } = req.params;
  const deleted = await commentService.softDelete(id);

  if (!deleted) {
    throw createError({
      message: "Comment not found",
      statusCode: 404,
      errors: { commentId: id },
    });
  }

  res.status(200).json(
    successResponse({
      message: "Comment deleted successfully",
      statusCode: 200,
    })
  );
}

module.exports = {
  createComment,
  getProjectComments,
  getCommentReplies,
  updateComment,
  deleteComment,
};
