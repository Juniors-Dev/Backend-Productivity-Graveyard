var express = require("express");
var router = express.Router();
var { toggleUpvote } = require("../controllers/voteController");
var { authenticate, asyncHandler } = require("../middleware");

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
 *           enum: [success]
 *           example: success
 *         statusCode:
 *           type: number
 *           example: 200
 *         message:
 *           type: string
 *           description: Indicates whether upvote was added or removed
 *           example: Project upvoted successfully
 *         data:
 *           type: object
 *           properties:
 *             upvoted:
 *               type: boolean
 *               description: True if the user upvoted, false if removed
 *               example: true
 *             count:
 *               type: number
 *               description: Projects total number of upvotes after toggling
 *               example: 22
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *           description: Always false for error responses
 *         status:
 *           type: string
 *           enum: [fail, error, unauthorized, bad request]
 *           description: Indicates the type of error that occurred
 *           example: error
 *         statusCode:
 *           type: number
 *           description: HTTP status code
 *           example: 404
 *         message:
 *           type: string
 *           description: Human-readable error message
 *           example: "Project not found"
 *         oneOf:
 *             - type: object
 *               description: Error details for specific fields
 *               example:
 *                 projectId: "No project with id:1234"
 *             - type: array
 *               items:
 *                 type: object
 *               description: List of validation errors
 *               example:
 *                 - field: "username"
 *                   message: "Username is required"
 *                 - field: "email"
 *                   message: "Email format is invalid"
 */

/**
 * @swagger
 * /votes/{projectId}/toggle:
 *   post:
 *     summary: Toggle upvote on a project
 *     description: Adds an upvote if the user hasn't upvoted yet, or removes it if they have
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
 *                 value:
 *                   success: true
 *                   status: success
 *                   statusCode: 200
 *                   message: Project upvoted successfully
 *                   data:
 *                     upvoted: true
 *                     count: 22
 *               removedUpvote:
 *                 value:
 *                   success: true
 *                   status: success
 *                   statusCode: 200
 *                   message: Upvote removed successfully
 *                   data:
 *                     upvoted: false
 *                     count: 21
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               status: unauthorized
 *               statusCode: 401
 *               message: "Unauthorized, invalid or expired token."
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               status: fail
 *               statusCode: 404
 *               message: Project not found
 *               errors:
 *                 projectId: "1234"
 */

router.post("/:projectId/toggle", authenticate, asyncHandler(toggleUpvote));

module.exports = router;
