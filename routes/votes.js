var express = require("express");
var router = express.Router();
var { toggleUpvote } = require("../controllers/voteController");
var { authenticate, asyncHandler, validateParamSchema } = require("../middleware");
var { projectIdSchema } = require("../schema/params");

/**
 * @swagger
 * components:
 *   schemas:
 *     ToggleUpvoteResponse:
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
 *           description: Indicates whether upvote was added or removed
 *           example: "Project upvoted successfully"
 *         data:
 *           type: object
 *           properties:
 *             upvoted:
 *               type: boolean
 *               description: True if the user upvoted, false if removed
 *               example: true
 *             count:
 *               type: integer
 *               description: Project's total number of upvotes after toggling
 *               example: 22
 */

/**
 * @swagger
 * /votes/{projectId}/toggle:
 *   post:
 *     summary: Toggle upvote on a project
 *     description: Adds an upvote if the user hasn't upvoted yet, or removes it if they have.
 *       Authentication is required. Rate limited to 600 requests per 10 minutes globally.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the project to toggle upvote for
 *     responses:
 *       200:
 *         description: Upvote toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToggleUpvoteResponse'
 *             examples:
 *               upvoted:
 *                 summary: User upvoted the project
 *                 value:
 *                   success: true
 *                   status: "success"
 *                   statusCode: 200
 *                   message: "Project upvoted successfully"
 *                   data:
 *                     upvoted: true
 *                     count: 22
 *               removedUpvote:
 *                 summary: User removed their upvote
 *                 value:
 *                   success: true
 *                   status: "success"
 *                   statusCode: 200
 *                   message: "Upvote removed successfully"
 *                   data:
 *                     upvoted: false
 *                     count: 21
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectNotFoundResponse' #notFoundResponse
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

router.post("/:projectId/toggle", validateParamSchema(projectIdSchema), authenticate, asyncHandler(toggleUpvote));

module.exports = router;
