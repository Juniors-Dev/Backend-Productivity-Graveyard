var { db } = require("../models");
var CommentService = require("../services/CommentService");
var commentService = new CommentService(db);
var { successResponse } = require("../utilities/response");
var createError = require("../utilities/createError");
var { getLimitOffset } = require("../utilities/getPagination");

async function createComment(req, res) {
  const { message, parentId } = req.body;
  const { projectId } = req.params;
  const { id: userId } = req.user;

  if (parentId) {
    const parentComment = await commentService.getOneId(parentId);

    if (!parentComment) {
      throw createError({
        message: "Parent comment not found",
        status: "not found",
        statusCode: 404,
        errors: { parentId }
      });
    }

    if (parentComment.parentId !== null) {
      throw createError({
        message: "Cannot reply to a reply",
        statusCode: 400,
        errors: { parentId }
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

  const { count, rows } = await commentService.getProjectComments(projectId, { limit, offset });

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

async function updateComment(req, res) {
  const { id } = req.params;
  const { message } = req.body;

  const comment = await commentService.getOneId(id);

  if (!comment) {
    throw createError({
      message: "Comment not found",
      status: "not found",
      statusCode: 404,
      errors: { commentId: id }
    });
  }

  if (comment.isDeleted) {
    throw createError({
      message: "Cannot update a deleted comment", 
      statusCode: 400,
      errors: { commentId: id }
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
      status: "not found",
      statusCode: 404,
      errors: { commentId: id }
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
  updateComment,
  deleteComment,
};
