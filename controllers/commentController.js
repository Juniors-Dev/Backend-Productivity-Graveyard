var { db } = require("../models");
var CommentService = require("../services/CommentService");
var commentService = new CommentService(db);
var { successResponse, errorResponse } = require("../utilities/response.js");
var { getLimitOffset } = require("../utilities/getPagination");

async function createComment(req, res) {
  const { message, parentId } = req.body;
  const { projectId } = req.params;
  const { id: userId } = req.user;

  if (parentId) {
    const parentComment = await commentService.getOneId(parentId);

    if (!parentComment) {
      return res.status(404).json(
        errorResponse({
          message: "Parent comment not found",
          status: "fail",
          statusCode: 404,
        })
      );
    }

    if (parentComment.parentId !== null) {
      return res.status(400).json(
        errorResponse({
          message: "Cannot reply to a reply",
          status: "bad request",
          statusCode: 400,
        })
      );
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
    return res.status(404).json(
      errorResponse({
        message: "Comment not found",
        status: "fail",
        statusCode: 404,
      })
    );
  }

  if (comment.isDeleted) {
    return res.status(400).json(
      errorResponse({
        message: "Cannot update a deleted comment",
        status: "bad request",
        statusCode: 400,
      })
    );
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
    return res.status(404).json(
      errorResponse({
        message: "Comment not found",
        status: "fail",
        statusCode: 404,
      })
    );
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
