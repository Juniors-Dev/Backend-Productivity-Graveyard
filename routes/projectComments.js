var express = require("express");
var router = express.Router({ mergeParams: true });
const { asyncHandler, authenticate, validateSchema, validateParamSchema } = require("../middleware");
var { createCommentSchema } = require("../schema/commentSchema");
var { projectIdSchema } = require("../schema/params");
var { createComment, getProjectComments } = require("../controllers/commentController");

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCommentSchema:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: The comment message
 *           example: "This project looks interesting!"
 *           minLength: 1
 *           maxLength: 2000
 *         parentId:
 *           type: integer
 *           nullable: true
 *           description: ID of parent comment (for replies)
 *           example: null
 *     CommentUser:
 *       type: object
 *       nullable: true
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         username:
 *           type: string
 *           example: "oddbjarne123"
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/avatar.jpg"
 *     CommentResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 123
 *         message:
 *           type: string
 *           description: The comment message (shows "[deleted]" if comment is deleted)
 *           example: "10/10 would clone"
 *         projectId:
 *           type: string
 *           format: uuid
 *           example: "987fcdeb-51a2-43d1-9c4f-123456789abc"
 *         parentId:
 *           type: integer
 *           nullable: true
 *           description: ID of parent comment (null for top-level comments)
 *           example: null
 *         isDeleted:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-05-22T14:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-05-22T14:45:00.000Z"
 *         User:
 *           $ref: '#/components/schemas/CommentUser'
 *         replies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 124
 *               message:
 *                 type: string
 *                 example: "I agree!"
 *               parentId:
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
 *     CommentSuccessResponse:
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
 *           example: 201
 *         message:
 *           type: string
 *           example: "Comment created successfully"
 *         data:
 *           $ref: '#/components/schemas/CommentResponse'
 *     CommentListResponse:
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
 *           example: "Comments retrieved successfully"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CommentResponse'
 *         meta:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               example: 25
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

/**
 * @swagger
 * /projects/{projectId}/comments:
 *   post:
 *     summary: Create a comment on a project
 *     description: Creates a new comment or reply to another comment on a project
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *         example: "987fcdeb-51a2-43d1-9c4f-123456789abc"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentSchema'
 *           examples:
 *             topLevelComment:
 *               summary: Top-level comment
 *               value:
 *                 message: "This project should be resurrected!"
 *             replyComment:
 *               summary: Reply to another comment
 *               value:
 *                 message: "I'd need to be resurrected first.."
 *                 parentId: 123
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentSuccessResponse'
 *       400:
 *         description: Bad request - validation error or cannot reply to reply
 *         content:
 *           application/json:
 *             schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/ValidationErrorResponse'
 *               - $ref: '#/components/schemas/ApplicationErrorResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: Resource not found (project or parent comment)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             examples:
 *               projectNotFound:
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 404
 *                   message: "Project not found"
 *                   errors: { projectId: "987fcdeb-51a2-43d1-9c4f-123456789abc" }
 *               parentNotFound:
 *                 value:
 *                   success: false
 *                   status: "not found"
 *                   statusCode: 404
 *                   message: "Parent comment not found"
 *                   errors: { parentId: 999 }
 *       429:
 *         description: Too many requests - global rate limit exceeded
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

router.post(
  "/:projectId/comments",
  authenticate,
  validateParamSchema(projectIdSchema),
  validateSchema(createCommentSchema),
  asyncHandler(createComment)
);

/**
 * @swagger
 * /projects/{projectId}/comments:
 *   get:
 *     summary: Get comments for a project
 *     description: Retrieves a list of paginated comments for a specific project
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *         example: "987fcdeb-51a2-43d1-9c4f-123456789abc"
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/offsetParam'
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentListResponse'
 *       400:
 *         description: Invalid project ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       429:
 *         description: Too many requests - global rate limit exceeded
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

router.get("/:projectId/comments", validateParamSchema(projectIdSchema), asyncHandler(getProjectComments));

module.exports = router;
