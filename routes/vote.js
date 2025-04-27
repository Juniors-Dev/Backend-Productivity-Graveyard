var express = require("express");
var router = express.Router();
var { toggleUpvote } = require("../controllers/voteController");
var asyncHandler = require("../middleware/asyncHandler");
var { authenticate, hasRole } = require("../middleware");

router.post("/:projectId/toggle", authenticate, asyncHandler(hasRole("user")), asyncHandler(toggleUpvote));

module.exports = router;
