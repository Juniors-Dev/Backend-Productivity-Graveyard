const express = require("express");
const router = express.Router();
const { getAll, getUserStats, getCurrentUserStats } = require("../controllers/statsController");
const { authenticate, asyncHandler } = require("../middleware");

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
 *     MostVotedProject:
 *       type: object
 *       nullable: true
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "aa177205-6aec-4f7c-934c-ebcbfdcb9df9"
 *         name:
 *           type: string
 *           example: "Book Reading List"
 *         votes:
 *           type: integer
 *           example: 1
 *
 *     GlobalStatsData:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           example: 78
 *         totalComments:
 *           type: integer
 *           example: 2
 *         totalProjects:
 *           type: integer
 *           example: 26
 *         averageLifespan:
 *           type: number
 *           format: float
 *           example: 7
 *         mostCommonCause:
 *           type: string
 *           nullable: true
 *           example: "Bored"
 *         funeralsToday:
 *           type: integer
 *           example: 0
 *         totalVotes:
 *           type: integer
 *           example: 2
 *         votesToday:
 *           type: integer
 *           example: 0
 *         averageEulogyLength:
 *           type: number
 *           format: float
 *           example: 137.88
 *         rageQuitRate:
 *           type: number
 *           format: float
 *           example: 23.08
 *         topBurialDay:
 *           type: string
 *           nullable: true
 *           example: "Wednesday"
 *         topBurialMonth:
 *           type: string
 *           nullable: true
 *           example: "January"
 *         mostVotedProject:
 *           $ref: "#/components/schemas/MostVotedProject"
 *
 *     UserStatsData:
 *       type: object
 *       properties:
 *         totalComments:
 *           type: integer
 *           example: 1
 *         totalProjects:
 *           type: integer
 *           example: 4
 *         averageLifespan:
 *           type: number
 *           format: float
 *           example: 23.75
 *         mostCommonCause:
 *           type: string
 *           nullable: true
 *           example: null
 *         funeralsToday:
 *           type: integer
 *           example: 0
 *         totalVotes:
 *           type: integer
 *           example: 1
 *         votesToday:
 *           type: integer
 *           example: 0
 *         averageEulogyLength:
 *           type: number
 *           format: float
 *           example: 218.75
 *         rageQuitRate:
 *           type: number
 *           format: float
 *           example: 50
 *         topBurialDay:
 *           type: string
 *           nullable: true
 *           example: "Wednesday"
 *         topBurialMonth:
 *           type: string
 *           nullable: true
 *           example: "August"
 *         mostVotedProject:
 *           $ref: "#/components/schemas/MostVotedProject"
 *
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
 *           $ref: "#/components/schemas/GlobalStatsData"
 *
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
 *           $ref: "#/components/schemas/UserStatsData"
 */
