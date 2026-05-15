const express = require("express");
const router = express.Router();
const {
  asyncHandler,
  authenticate,
  validateSchema,
  validateParamSchema,
  ownsEntity,
  createRateLimiter,
} = require("../middleware");
const { updateCommentSchema } = require("../schema/commentSchema");
const { commentIdSchema } = require("../schema/params");
const { updateComment, deleteComment, getCommentReplies } = require("../controllers/commentController");
const CommentService = require("../services/CommentService");
const { db } = require("../models");
const commentService = new CommentService(db);

if (process.env.NODE_ENV !== "test") {
  router.use(
    createRateLimiter({
      max: parseInt(process.env.RATE_LIMIT_MAX) || 10,
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000,
      message: "Too many comments, please try again later",
    })
  );
}

router.get("/:id/replies", validateParamSchema(commentIdSchema), asyncHandler(getCommentReplies));

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

/**
 * @swagger
 * /comments/{id}/replies:
 *   get:
 *     summary: Get replies for a comment
 *     description: |
 *       Retrieves all replies in a comment thread with pagination.
 *       Shows replies in chronological order with parent comment information.
 *
 *       **Note:** Soft-deleted comments will show `[deleted]` as the message content while preserving thread structure.
 *
 *       The `parent` field shows which comment is being replied to, so you can display
 *       "Reply to @username" or show the original comment context.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the comment whose replies you want to retrieve.
 *           Can be a root comment or any reply in the thread.
 *         example: 123
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/offsetParam'
 *     responses:
 *       200:
 *         description: Replies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepliesListResponse'
 *             example:
 *               success: true
 *               status: "success"
 *               statusCode: 200
 *               message: "Replies retrieved successfully"
 *               data:
 *                 - id: 124
 *                   message: "Great point!"
 *                   parentId: 123
 *                   threadId: 123
 *                   isDeleted: false
 *                   createdAt: "2025-06-14T15:30:00.000Z"
 *                   updatedAt: "2025-06-14T15:30:00.000Z"
 *                   User:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     username: "commenter123"
 *                     avatarUrl: null
 *                   parent:
 *                     id: 123
 *                     message: "Original comment"
 *                     User:
 *                       username: "original_poster"
 *                 - id: 125
 *                   message: "[deleted]"
 *                   parentId: 123
 *                   threadId: 123
 *                   isDeleted: true
 *                   createdAt: "2025-06-14T15:45:00.000Z"
 *                   updatedAt: "2025-06-14T16:00:00.000Z"
 *                   User: null
 *                   parent:
 *                     id: 123
 *                     message: "Original comment"
 *                     User:
 *                       username: "original_poster"
 *               meta:
 *                 total: 15
 *                 limit: 10
 *                 offset: 0
 *                 hasNext: true
 *       400:
 *         description: Invalid comment ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               status: "bad request"
 *               statusCode: 400
 *               message: "Validation Error: id must be a positive integer"
 *               errors:
 *                 - field: "id"
 *                   message: "id must be a positive integer"
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             example:
 *               success: false
 *               status: "fail"
 *               statusCode: 404
 *               message: "Comment not found"
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *               success: false
 *               status: "error"
 *               statusCode: 429
 *               message: "Too many requests, please try again later"
 *               errors: null
 *         headers:
 *           RateLimit-Policy:
 *             $ref: '#/components/headers/RateLimit-Policy'
 *           RateLimit-Limit:
 *             $ref: '#/components/headers/RateLimit-Limit'
 *           RateLimit-Remaining:
 *             $ref: '#/components/headers/RateLimit-Remaining'
 *           RateLimit-Reset:
 *             $ref: '#/components/headers/RateLimit-Reset'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalErrorResponse'
 *             example:
 *               success: false
 *               status: "error"
 *               statusCode: 500
 *               message: "Internal server error"
 *               errors: null
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
 *               data:
 *                 id: 123
 *                 message: "This is my updated comment"
 *                 projectId: "987fcdeb-51a2-43d1-9c4f-123456789abc"
 *                 parentId: null
 *                 threadId: 123
 *                 isDeleted: false
 *                 createdAt: "2025-06-14T20:19:55.354Z"
 *                 updatedAt: "2025-06-14T20:25:10.123Z"
 *                 User:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   username: "developer123"
 *                   avatarUrl: "https://example.com/avatar.jpg"
 *                 replies: []
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationErrorResponse'
 *             example:
 *               success: false
 *               status: "bad request"
 *               statusCode: 400
 *               message: "Validation Error: message is required"
 *               errors:
 *                 - field: "message"
 *                   message: "Comment is required"
 *                 - field: "message"
 *                   message: "Comment cannot be empty"
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: Forbidden - you don't have permission to update this comment (comment may have been deleted)
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
 *           RateLimit-Policy:
 *             $ref: '#/components/headers/RateLimit-Policy'
 *           RateLimit-Limit:
 *             $ref: '#/components/headers/RateLimit-Limit'
 *           RateLimit-Remaining:
 *             $ref: '#/components/headers/RateLimit-Remaining'
 *           RateLimit-Reset:
 *             $ref: '#/components/headers/RateLimit-Reset'
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
 *               status: "fail"
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
 *           RateLimit-Policy:
 *             $ref: '#/components/headers/RateLimit-Policy'
 *           RateLimit-Limit:
 *             $ref: '#/components/headers/RateLimit-Limit'
 *           RateLimit-Remaining:
 *             $ref: '#/components/headers/RateLimit-Remaining'
 *           RateLimit-Reset:
 *             $ref: '#/components/headers/RateLimit-Reset'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalErrorResponse'
 */

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
 *
 *     CommentParent:
 *       type: object
 *       nullable: true
 *       properties:
 *         id:
 *           type: integer
 *           example: 123
 *         message:
 *           type: string
 *           example: "Original comment being replied to"
 *         User:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *               example: "original_commenter"
 *
 *     RepliesListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         status:
 *           type: string
 *           example: "success"
 *         statusCode:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "Replies retrieved successfully"
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 124
 *               message:
 *                 type: string
 *                 example: "Great point!"
 *               parentId:
 *                 type: integer
 *                 example: 123
 *               threadId:
 *                 type: integer
 *                 example: 123
 *               isDeleted:
 *                 type: boolean
 *                 example: false
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *               User:
 *                 $ref: '#/components/schemas/CommentUser'
 *               parent:
 *                 $ref: '#/components/schemas/CommentParent'
 *         meta:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               example: 15
 *             limit:
 *               type: integer
 *               example: 10
 *             offset:
 *               type: integer
 *               example: 0
 *             hasNext:
 *               type: boolean
 *               example: true
 */
