var { db } = require("../models/index.js");
var { VoteService, ProjectService } = require("../services/index.js");
var voteService = new VoteService(db);
var projectService = new ProjectService(db);
var { successResponse } = require("../utilities/response.js");
var createError = require("../utilities/createError");

async function toggleUpvote(req, res) {
  const { projectId } = req.params;
  const { id: userId } = req.user;

  const project = await projectService.getOneId(projectId);
  if (!project) {
    throw createError({
      message: "Project not found",
      status: "not found",
      statusCode: 404,
      errors: { projectId },
    });
  }

  const { voted, count } = await voteService.toggleUpvote(userId, projectId);

  res.status(200).json(
    successResponse({
      message: voted ? "Project upvoted successfully" : "Upvote removed successfully",
      data: {
        upvoted: voted,
        count,
      },
      statusCode: 200,
    })
  );
}

module.exports = {
  toggleUpvote,
};
