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

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateCommentSchema:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: The updated comment message
 *           example: "This is my updated comment"
 *           minLength: 1
 *           maxLength: 2000
 */
/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment
 *     description: Updates the message of an existing comment (only by comment owner)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Comment ID (must be positive integer)
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCommentSchema'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentSuccessResponse'
 *             example:
 *               success: true
 *               status: "success"
 *               statusCode: 200
 *               message: "Comment updated successfully"
 *       400:
 *         description: Cannot update a deleted comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationErrorResponse'
 *             example:
 *               success: false
 *               status: "fail"
 *               statusCode: 400
 *               message: "Cannot update a deleted comment"
 *               errors: { "commentId": 123 }
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: Forbidden - user does not own this comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *         headers:
 *           $ref: '#/components/headers/RateLimitHeaders'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalErrorResponse'
 */

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Soft deletes a comment (only by comment owner)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Comment ID (must be positive integer)
 *         example: 123
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleSuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: Forbidden - user does not own this comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             example:
 *               success: false
 *               status: "not found"
 *               statusCode: 404
 *               message: "Comment not found"
 *               errors: { commentId: 123 }
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *         headers:
 *           $ref: '#/components/headers/RateLimitHeaders'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalErrorResponse'
 */

module.exports = router;
