const express = require("express");
const router = express.Router();
const {
  getAll,
  getOneId,
  create,
  update,
  deleteProject,
  getAllTypes,
  addType,
  removeType,
  getAllTombstones,
} = require("../controllers/projectController");
const asyncHandler = require("../middleware/asyncHandler");
const { authenticate, hasRole, validateSchema, validateParamSchema, ownsEntity, isLoggedIn } = require("../middleware");
const { projectSchema, projectUpdateSchema, typeIdSchema, uuidSchema } = require("../schema");
const { ProjectService } = require("../services");
const { db } = require("../models");
const projectService = new ProjectService(db);
const projectComments = require("./projectComments");

router.get("/", isLoggedIn, asyncHandler(getAll));
router.get("/types", asyncHandler(getAllTypes));
router.get("/tombstones", asyncHandler(getAllTombstones));
router.get("/:id", validateParamSchema(uuidSchema), isLoggedIn, asyncHandler(getOneId));
router.post("/", authenticate, validateSchema(projectSchema), asyncHandler(hasRole("user")), asyncHandler(create));

router.put(
  "/:id",
  authenticate,
  validateParamSchema(uuidSchema),
  validateSchema(projectUpdateSchema),
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(update)
);

router.delete(
  "/:id",
  authenticate,
  validateParamSchema(uuidSchema),
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(deleteProject)
);

router.put(
  "/:id/type",
  authenticate,
  validateParamSchema(uuidSchema),
  validateSchema(typeIdSchema),
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(addType)
);

router.delete(
  "/:id/type",
  authenticate,
  validateParamSchema(uuidSchema),
  validateSchema(typeIdSchema),
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(removeType)
);

router.use("/", projectComments);

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
 *           type: integer
 *           nullable: true
 *           example: 1
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
 *         tombstone:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             name:
 *               type: string
 *               example: "Feature Creep"
 *             imageUrl:
 *               type: string
 *               example: "/images/tombstone1.png"
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
 *     ProjectErrorResponse:
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
 *           example: 409
 *         message:
 *           type: string
 *           example: "Type already exists in project"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *
 *     ProjectValidationErrorResponse:
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
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "fieldName"
 *               message:
 *                 type: string
 *                 example: "Error message"
 *           description: List of validation errors with field names and messages
 *           example:
 *             - field: "name"
 *               message: "Name is required"
 *             - field: "description"
 *               message: "Description must be at least 10 characters"
 *
 *     ProjectNotFoundResponse:
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
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *
 *     ProjectServerErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         status:
 *           type: string
 *           example: "error"
 *         statusCode:
 *           type: integer
 *           example: 500
 *         message:
 *           type: string
 *           example: "Error adding type to project"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *
 */

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
 *     security:
 *       - bearerAuth: []
 *       - {}
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
 * /projects/types:
 *   get:
 *     summary: Get all project types
 *     description: Returns a list of all predefined reasons a project was discontinued. Useful for building dropdown menus in forms.
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of project types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 6
 *                       name:
 *                         type: string
 *                         example: Feature Creep
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-05-07T20:30:17.974Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-05-07T20:30:17.974Z"
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
 * /projects/tombstones:
 *   get:
 *     summary: Get all tombstones
 *     description: Returns a list of all tombstones (reasons for project discontinuation).
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of tombstones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Feature Creep
 *                       imageUrl:
 *                         type: string
 *                         example: "/images/tombstone1.png"
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
 * /projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *       - {}
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
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
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
 * /projects/{id}:
 *   put:
 *     summary: Update an existing project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *       404:
 *         description: Project not found
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
 * /projects/{id}:
 *   delete:
 *     summary: Soft delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: boolean
 *                    example: true
 *                  status:
 *                    type: string
 *                    example: success
 *                  statusCode:
 *                    type: integer
 *                    example: 200
 *                  message:
 *                    type: string
 *                    example: Project deleted successfully
 *                  data:
 *                    type: null
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *       404:
 *         description: Project not found
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
 * /projects/{id}/type:
 *   put:
 *     summary: Add a type (tag) to a project
 *     description: >
 *       Adds a type (tag) to the specified project. The type should be provided in the request body as a type ID.
 *       Only the project owner or users with the appropriate role can add a type to a project.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID of the project
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectSingleResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *       404:
 *         description: Project or type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectNotFoundResponse'
 *       409:
 *         description: Type already exists on project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectErrorResponse'
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
 *               $ref: '#/components/schemas/ProjectServerErrorResponse'
 */

/**
 * @swagger
 * /projects/{id}/type:
 *   delete:
 *     summary: Remove a type (tag) from a project
 *     description: >
 *       Removes a type (tag) from the specified project. The type should be provided in the request body as a type ID.
 *       Only the project owner or users with the appropriate role can remove a type from a project.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID of the project
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectSingleResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *       404:
 *         description: Project or type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectNotFoundResponse'
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
 *               $ref: '#/components/schemas/ProjectServerErrorResponse'
 */

module.exports = router;
