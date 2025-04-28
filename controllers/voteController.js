var { db } = require("../models/index.js");
var { VoteService } = require("../services/index.js");
var voteService = new VoteService(db);
var { successResponse } = require("../utilities/response.js");

async function toggleUpvote(req, res) {
  const { projectId } = req.params;
  const { id: userId } = req.user;

  const { voted, count } = await voteService.toggleUpvote(userId, projectId);

  res.status(200).json(
    successResponse({
      message: voted ? "Project upvoted successfully" : "Upvote removed successfully",
      data: {
        upvoted: voted,
        count: count,
      },
      statusCode: 200,
    })
  );
}

module.exports = {
  toggleUpvote,
};
