var express = require("express");
var router = express.Router({ mergeParams: true });
const { asyncHandler, authenticate, validateSchema, validateParamSchema } = require("../middleware");
var { createCommentSchema } = require("../schema/commentSchema");
var { projectIdSchema } = require("../schema/params");
var { createComment, getProjectComments } = require("../controllers/commentController");

router.post(
  "/:projectId/comments",
  authenticate,
  validateParamSchema(projectIdSchema),
  validateSchema(createCommentSchema),
  asyncHandler(createComment)
);

router.get("/:projectId/comments", validateParamSchema(projectIdSchema), asyncHandler(getProjectComments));

module.exports = router;
