var express = require("express");
var router = express.Router();
var {
  getAll,
  getOneId,
  create,
  update,
  deleteProject,
  getAllTypes,
  addType,
  removeType,
} = require("../controllers/projectController");
var asyncHandler = require("../middleware/asyncHandler");
var { authenticate, hasRole, validateSchema, ownsEntity, isLoggedIn } = require("../middleware");
var { projectSchema, projectUpdateSchema, typeIdSchema } = require("../schema/projectSchema");
var { ProjectService } = require("../services");
var { db } = require("../models");
var projectService = new ProjectService(db);
var projectComments = require("./projectComments");

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Retrieve a list of buried projects
 *     description: >
 *       Returns a paginated list of all projects in the graveyard.
 *       Supports filtering by status, type, user, and supports sorting and search queries.
 *       This endpoint is publicly accessible and returns metadata for pagination.
 *       A logged in user, it will return true for the userHasVoted field if the user has voted on the project.
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of projects to return
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         required: false
 *         description: Number of projects to skip (for pagination)
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter projects by status
 *         schema:
 *           type: string
 *           enum: [inactive, active, buried, resurrected, completed, archived]
 *       - in: query
 *         name: orderBy
 *         required: false
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           enum: [status, createdAt, updatedAt, name, etc..]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         required: false
 *         description: Sort direction (asc or desc)
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: userId
 *         required: false
 *         description: Filter projects by user ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: types
 *         required: false
 *         description: Comma-separated list of type IDs to filter by (e.g., 1,2,3)
 *         schema:
 *           type: string
 *           example: "1,2,3"
 *       - in: query
 *         name: query
 *         required: false
 *         description: Search by project name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of filtered projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectArrayResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.get("/", isLoggedIn, asyncHandler(getAll));

router.get("/types", asyncHandler(getAllTypes));

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: UUID of the project
 *     responses:
 *       200:
 *         description: Project found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectSingleResponse'
 *       401:
 *         description: Unauthorized or bad token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */

router.get("/:id", isLoggedIn, asyncHandler(getOneId));

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectSingleResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */

router.post("/", authenticate, validateSchema(projectSchema), asyncHandler(hasRole("user")), asyncHandler(create));

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update an existing project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectUpdateBody'
 *     responses:
 *       200:
 *         description: Project updated
 */

router.put(
  "/:id",
  authenticate,
  validateSchema(projectUpdateSchema),
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(update)
);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Soft delete a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Project deleted
 */

router.delete(
  "/:id",
  authenticate,
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(deleteProject)
);

/**
 * @swagger
 * /projects/{id}/type:
 *   put:
 *     summary: Add a type (tag) to a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TypeId'
 *     responses:
 *       200:
 *         description: Type added to project
 */

router.put(
  "/:id/type",
  authenticate,
  validateSchema(typeIdSchema),
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(addType)
);

/**
 * @swagger
 * /projects/{id}/type:
 *   delete:
 *     summary: Remove a type (tag) from a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TypeId'
 *     responses:
 *       200:
 *         description: Type removed from project
 */
router.delete(
  "/:id/type",
  authenticate,
  validateSchema(typeIdSchema),
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(removeType)
);

router.use("/", projectComments);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - types
 *         - userId
 *         - eulogy
 *         - causeOfDeath
 *         - startDate
 *         - endDate
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Feature Creeper Codex"
 *         description:
 *           type: string
 *           example: "A parody app showing how simple ideas spiral into feature-bloated chaos."
 *         eulogy:
 *           type: string
 *           example: "Laid to rest after haunting VS Code for too long."
 *         causeOfDeath:
 *           type: string
 *           example: "Dog Puked on the server"
 *         status:
 *           type: string
 *           enum: [inactive, active, buried, resurrected, completed, archived]
 *           example: "archived"
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2024-10-01"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2025-01-15"
 *         tombstoneId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         userId:
 *           type: string
 *           format: uuid
 *         types:
 *           type: array
 *           items:
 *             type: integer
 *             example: 1
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             username:
 *               type: string
 *             avatarUrl:
 *               type: string
 *               nullable: true
 *         commentCount:
 *           type: integer
 *         upvoteCount:
 *           type: integer
 *         userHasVoted:
 *           type: boolean
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ProjectArrayResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         status:
 *           type: string
 *           example: "success"
 *         statusCode:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "Success"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Project'
 *         meta:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             offset:
 *               type: integer
 *             limit:
 *               type: integer
 *             hasNext:
 *               type: boolean
 *
 *     ProjectSingleResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         status:
 *           type: string
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Project'
 *
 *     NotFoundResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         status:
 *           type: string
 *           example: "fail"
 *         statusCode:
 *           type: integer
 *           example: 404
 *         message:
 *           type: string
 *           example: "Project not found"
 *
 *     UnauthorizedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         status:
 *           type: string
 *           example: "fail"
 *         statusCode:
 *           type: integer
 *           example: 401
 *         message:
 *           type: string
 *           example: "Unauthorized, invalid or expired token."
 *
 *     ValidationErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         status:
 *           type: string
 *           example: "bad request"
 *         statusCode:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: "Validation Error: X errors occurred"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 */
