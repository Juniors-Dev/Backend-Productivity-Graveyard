var express = require("express");
var router = express.Router();
var { getAll, getUserStats, getCurrentUserStats } = require("../controllers/statsController");
var { authenticate, asyncHandler } = require("../middleware");

router.get("/", asyncHandler(getAll));
router.get("/user/me", authenticate, asyncHandler(getCurrentUserStats));

/**
 * @swagger
 * tags:
 *   - name: Stats
 *     description: Routes for retrieving statistics about projects, users, and global data.
 */

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Retrieve global statistics
 *     description: >
 *       Returns aggregated statistics about all projects, users, comments, and votes in the system.
 *       Includes metrics such as average project lifespan, most common cause of project abandonment, and top burial day/month.
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Global statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlobalStatsResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalErrorResponse'
 */

/**
 * @swagger
 * /stats/user/me:
 *   get:
 *     summary: Retrieve statistics for the current user
 *     description: >
 *       Returns statistics specific to the currently authenticated user, including metrics such as total projects, comments, votes, and average project lifespan.
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStatsResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalErrorResponse'
 */

/**
 * @swagger
 * /stats/user/{id}:
 *   get:
 *     summary: Retrieve statistics for a specific user
 *     description: >
 *       Returns statistics specific to a user identified by their ID, including metrics such as total projects, comments, votes, and average project lifespan.
 *     tags: [Stats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the user
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStatsResponse'
 *       400:
 *         description: Bad request (missing user ID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalErrorResponse'
 */
router.get("/user/:id", asyncHandler(getUserStats));

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     GlobalStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         status:
 *           type: string
 *           example: success
 *         statusCode:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: Success
 *         data:
 *           type: object
 *           properties:
 *             totalUsers:
 *               type: string
 *               example: "78"
 *             totalComments:
 *               type: string
 *               example: "2"
 *             totalProjects:
 *               type: string
 *               example: "26"
 *             averageLifespan:
 *               type: string
 *               example: "7.0000000000000000"
 *             mostCommonCause:
 *               type: string
 *               example: "Bored"
 *             funeralsToday:
 *               type: string
 *               example: "0"
 *             totalVotes:
 *               type: string
 *               example: "2"
 *             votesToday:
 *               type: string
 *               example: "0"
 *             averageEulogyLength:
 *               type: string
 *               example: "137.8846153846153846"
 *             rageQuitRate:
 *               type: string
 *               example: "23.0769230769230769"
 *             topBurialDay:
 *               type: string
 *               example: "Wednesday"
 *             topBurialMonth:
 *               type: string
 *               example: "January"
 *             mostVotedProject:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "aa177205-6aec-4f7c-934c-ebcbfdcb9df9"
 *                 name:
 *                   type: string
 *                   example: "Book Reading List"
 *                 votes:
 *                   type: integer
 *                   example: 1
 *     UserStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         status:
 *           type: string
 *           example: success
 *         statusCode:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: Success
 *         data:
 *           type: object
 *           properties:
 *             totalComments:
 *               type: string
 *               example: "1"
 *             totalProjects:
 *               type: string
 *               example: "4"
 *             averageLifespan:
 *               type: string
 *               example: "23.7500000000000000"
 *             mostCommonCause:
 *               type: string
 *               example: null
 *             funeralsToday:
 *               type: string
 *               example: "0"
 *             totalVotes:
 *               type: string
 *               example: "1"
 *             votesToday:
 *               type: string
 *               example: "0"
 *             averageEulogyLength:
 *               type: string
 *               example: "218.7500000000000000"
 *             rageQuitRate:
 *               type: string
 *               example: "50.0000000000000000"
 *             topBurialDay:
 *               type: string
 *               example: "Wednesday"
 *             topBurialMonth:
 *               type: string
 *               example: "August"
 *             mostVotedProject:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "0cfbfa35-70a7-4d18-b1ff-1d198cf425b0"
 *                 name:
 *                   type: string
 *                   example: "Diet Tracker"
 *                 votes:
 *                   type: integer
 *                   example: 1
 */
