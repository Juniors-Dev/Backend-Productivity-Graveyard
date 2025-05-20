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
 *     summary: Get all projects (with optional filters)
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 */

router.get("/", isLoggedIn, asyncHandler(getAll));

router.get("/types", asyncHandler(getAllTypes));

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a single project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the project
 *     responses:
 *       200:
 *         description: Project found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
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
 *       201:
 *         description: Project created
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
 *         - causeOfDeath
 *         - startDate
 *         - endDate
 *       properties:
 *         name:
 *           type: string
 *           example: Productivity Graveyard
 *         description:
 *           type: string
 *           example: A humorous app to memorialize abandoned dev projects.
 *         causeOfDeath:
 *           type: string
 *           example: Dog puked on the server
 *         eulogy:
 *           type: string
 *           example: Laid to rest after haunting VS Code for too long.
 *         status:
 *           type: string
 *           enum: [active, buried, archived]
 *           example: archived
 *         startDate:
 *           type: string
 *           format: date
 *           example: 2024-10-01
 *         endDate:
 *           type: string
 *           format: date
 *           example: 2025-01-15
 *         tombstoneId:
 *           type: string
 *           format: uuid
 *         types:
 *           type: array
 *           items:
 *             type: integer
 *           example: [2, 3]
 *
 *     ProjectResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
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
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Project'
 *         meta:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             limit:
 *               type: integer
 *             offset:
 *               type: integer
 *             hasNext:
 *               type: boolean
 *
 *     ProjectUpdateBody:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         eulogy:
 *           type: string
 *
 *     TypeId:
 *       type: object
 *       required:
 *         - typeId
 *       properties:
 *         typeId:
 *           type: integer
 *           example: 1
 */
