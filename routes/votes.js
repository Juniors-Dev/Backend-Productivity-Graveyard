var express = require("express");
var router = express.Router();
var { toggleUpvote } = require("../controllers/voteController");
var { authenticate, asyncHandler } = require("../middleware");

router.post("/:projectId/toggle", authenticate, asyncHandler(toggleUpvote));

module.exports = router;
