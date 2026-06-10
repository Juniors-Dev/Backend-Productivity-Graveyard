const { db } = require("../models");
const { VoteService, ProjectService } = require("../services/index");
const voteService = new VoteService(db);
const projectService = new ProjectService(db);
const { successResponse, errorResponse, createError } = require("../utilities");

async function toggleUpvote(req, res) {
  const { projectId } = req.params;
  const { id: userId } = req.user;

  const project = await projectService.getOneId(projectId); // Throws 404 if not found

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
