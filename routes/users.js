var express = require("express");
var router = express.Router();
const { getUser, updateMe, getMe, softDeletedUser, getAllSoftDeleted } = require("../controllers/userController");
const { authenticate, hasRole, isAdmin, isSelfOrAdmin } = require("../middleware/authentication");
var { validateSchema, asyncHandler, validateCredentials } = require("../middleware");
const { loginSchema, registerSchema, updateUserSchema } = require("../schema");

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         username:
 *           type: string
 *           example: johndoe123
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-04-30T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-04-30T12:00:00Z"
 *     SoftDeletedUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         username:
 *           type: string
 *           example: johndoe123
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-04-30T12:00:00Z"
 *     UpdateUserSchema:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: User's first name
 *           example: John
 *         lastName:
 *           type: string
 *           description: User's last name
 *           example: Doe
 *         username:
 *           type: string
 *           description: User's unique username
 *           example: johndoe123
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [bad request, unauthorized, fail]
 *           example: bad request
 *         data:
 *           type: object
 *           properties:
 *             errors:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Username is required", "Invalid email format"]
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Welcome endpoint
 *     description: Returns a welcome message
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to the API
 */

router.get("/", function (req, res, next) {
  res.status(200).json({ message: "Welcome to the API" });
});

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *             example:
 *               status: success
 *               data:
 *                 id: 1
 *                 firstName: John
 *                 lastName: Doe
 *                 username: johndoe123
 *                 email: john.doe@example.com
 *                 createdAt: "2024-04-30T12:00:00Z"
 *                 updatedAt: "2024-04-30T12:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: unauthorized
 *               data:
 *                 errors: ["Invalid or expired token"]
 */

router.get("/me", asyncHandler(authenticate), asyncHandler(getMe));

/**
 * @swagger
 * /users/deleted:
 *   get:
 *     summary: Get all soft-deleted users
 *     description: Retrieve a list of all users that have been soft-deleted
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of soft-deleted users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SoftDeletedUser'
 *             example:
 *               status: success
 *               data:
 *                 - id: 1
 *                   firstName: John
 *                   lastName: Doe
 *                   username: johndoe123
 *                   email: john.doe@example.com
 *                   deletedAt: "2024-04-30T12:00:00Z"
 *                 - id: 2
 *                   firstName: Jane
 *                   lastName: Smith
 *                   username: janesmith456
 *                   email: jane.smith@example.com
 *                   deletedAt: "2024-04-30T11:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: unauthorized
 *               data:
 *                 errors: ["Invalid or expired token"]
 */

router.get("/deleted", asyncHandler(authenticate), asyncHandler(getAllSoftDeleted));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a user's profile by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *             example:
 *               status: success
 *               data:
 *                 id: 1
 *                 firstName: John
 *                 lastName: Doe
 *                 username: johndoe123
 *                 email: john.doe@example.com
 *                 createdAt: "2024-04-30T12:00:00Z"
 *                 updatedAt: "2024-04-30T12:00:00Z"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               data:
 *                 errors: ["User not found"]
 */

router.get("/:id", asyncHandler(getUser));

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserSchema'
 *           example:
 *             firstName: John
 *             lastName: Doe
 *             username: johndoe123
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *             example:
 *               status: success
 *               data:
 *                 id: 1
 *                 firstName: John
 *                 lastName: Doe
 *                 username: johndoe123
 *                 email: john.doe@example.com
 *                 createdAt: "2024-04-30T12:00:00Z"
 *                 updatedAt: "2024-04-30T12:00:00Z"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: bad request
 *               data:
 *                 errors: ["Username is required"]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: unauthorized
 *               data:
 */

router.put("/me", asyncHandler(authenticate), validateSchema(updateUserSchema), asyncHandler(updateMe));

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Soft delete current user
 *     description: Soft delete the authenticated user's account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account soft-deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: User account soft-deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.delete("/me", asyncHandler(authenticate), asyncHandler(softDeletedUser));

module.exports = router;
