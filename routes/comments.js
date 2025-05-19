var express = require("express");
var router = express.Router();
const { asyncHandler, authenticate, validateSchema, validateParamSchema, ownsEntity } = require("../middleware");
var { updateCommentSchema } = require("../schema/commentSchema");
var { commentIdSchema } = require("../schema/params");
var { updateComment, deleteComment } = require("../controllers/commentController");
var CommentService = require("../services/CommentService");
var { db } = require("../models");
var commentService = new CommentService(db);

router.put(
  "/:id",
  authenticate,
  validateParamSchema(commentIdSchema),
  asyncHandler(ownsEntity(commentService)),
  validateSchema(updateCommentSchema),
  asyncHandler(updateComment)
);

router.delete(
  "/:id",
  authenticate,
  validateParamSchema(commentIdSchema),
  asyncHandler(ownsEntity(commentService)),
  asyncHandler(deleteComment)
);

module.exports = router;
