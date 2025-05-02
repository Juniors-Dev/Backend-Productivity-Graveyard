var { db } = require("../models");
var CommentService = require("../services/CommentService");
var commentService = new CommentService(db);
var { successResponse } = require("../utilities/response.js");
var { getLimitOffset } = require("../utilities/getPagination");
const serializeComment = require("../utilities/commentSerializer");

async function createComment(req, res) {
  const { message, parentId } = req.body;
  const { projectId } = req.params;
  const { id: userId } = req.user;

  const comment = await commentService.create({ userId, projectId, message, parentId });

  res.status(201).json(
    successResponse({
      message: "Comment created successfully",
      data: comment,
      statusCode: 201,
    })
  );
}

async function getProjectComments(req, res) {
  const { projectId } = req.params;
  const { limit, offset } = getLimitOffset(req);

  const serviceResult = await commentService.getProjectComments(projectId, { limit, offset });
  const comments = serviceResult.rawComments.map(serializeComment);

  res.status(200).json(
    successResponse({
      message: "Comments retrieved successfully",
      data: comments,
      meta: {
        totalCount: serviceResult.totalCount,
        limit: serviceResult.limit,
        offset: serviceResult.offset,
      },
      statusCode: 200,
    })
  );
}

async function updateComment(req, res) {
  const { id } = req.params;
  const { message } = req.body;

  const updatedComment = await commentService.update(id, message);
  const serializedComment = serializeComment(updatedComment);

  res.status(200).json(
    successResponse({
      message: "Comment updated successfully",
      data: serializedComment,
      statusCode: 200,
    })
  );
}

async function deleteComment(req, res) {
  await commentService.softDelete(req.params.id);

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
