var express = require("express");
var router = express.Router();
var { toggleUpvote, getUserUpvoteStatus } = require("../controllers/voteController");
var asyncHandler = require("../middleware/asyncHandler");
var { authenticate, hasRole } = require("../middleware");

router.post("/:projectId/toggle", authenticate, asyncHandler(hasRole("user")), asyncHandler(toggleUpvote));

router.get("/:projectId/status", authenticate, asyncHandler(hasRole("user")), asyncHandler(getUserUpvoteStatus));

module.exports = router;
