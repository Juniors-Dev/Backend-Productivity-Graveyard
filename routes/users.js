var express = require("express");
var router = express.Router();
const { getUser, updateMe, getMe, softDeletedUser, getAllSoftDeleted } = require("../controllers/userController");
const { authenticate, hasRole, isAdmin, isSelfOrAdmin } = require("../middleware/authentication");
var { validateSchema, asyncHandler, validateCredentials } = require("../middleware");
const { loginSchema, registerSchema, updateUserSchema } = require("../schema");

router.get("/", function (req, res, next) {
  res.status(200).json({ message: "Welcome to the API" });
});

router.get("/me", asyncHandler(authenticate), asyncHandler(getMe));
router.get("/deleted", asyncHandler(authenticate), asyncHandler(getAllSoftDeleted));
router.get("/:id", asyncHandler(getUser));
router.put("/me", asyncHandler(authenticate), validateSchema(updateUserSchema), asyncHandler(updateMe));
router.delete("/me", asyncHandler(authenticate), asyncHandler(softDeletedUser));

/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "a88c5e91-57e7-4121-872f-6b793a154f6c"
 *         fullName:
 *           type: string
 *           example: "John Doe"
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
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "404: Social life not found."
 *         avatarUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: "https://cdn.example.com/avatar/johndoe.jpg"
 *         role:
 *           type: string
 *           example: user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-04-30T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-04-30T12:00:00Z"
 *
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
 *
 *     UpdateUserSchema:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 15
 *           minLength: 2
 *           example: John
 *         lastName:
 *           type: string
 *           maxLength: 15
 *           minLength: 2
 *           example: Doe
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 20
 *           pattern: "^[a-zA-Z0-9_]+$"
 *           example: johndoe123
 *         bio:
 *           type: string
 *           maxLength: 500
 *           example: "I'm a developer."
 *         avatarUrl:
 *           type: string
 *           format: uri
 *           example: "https://cdn.example.com/avatar/johndoe.jpg"
 *       description: At least one field must be provided. No unknown fields allowed.
 *       additionalProperties: false
 *
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
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *             example:
 *               status: success
 *               statusCode: 200
 *               message: Current user retrieved successfully.
 *               data:
 *                 id: "4fae1234-b678-433e-aaaa-17faae0cf1b2"
 *                 username: johndoe123
 *                 fullName: John Doe
 *                 firstName: John
 *                 lastName: Doe
 *                 email: john.doe@example.com
 *                 bio: "I like building stuff."
 *                 avatarUrl: "https://cdn.example.com/avatar/johndoe.jpg"
 *                 role: user
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *             examples:
 *               missingToken:
 *                 summary: No authorization header
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 401
 *                   message: "Unauthorized, token not found."
 *                   errors: null
 *               expiredToken:
 *                 summary: Expired JWT token
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 401
 *                   message: "Unauthorized, token has expired."
 *                   errors: null
 *               invalidToken:
 *                 summary: Invalid JWT token
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 401
 *                   message: "Unauthorized, invalid or expired token."
 *                   errors: null
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             example:
 *               success: false
 *               status: "fail"
 *               statusCode: 404
 *               message: "Failed to retrive user"
 *               errors: null
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
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "User retrieved successfully."
 *               data:
 *                 id: "4fae1234-b678-433e-aaaa-17faae0cf1b2"
 *                 fullName: John Doe
 *                 username: johndoe123
 *                 bio: "My best friend is a rubber duck!"
 *                 avatarUrl: "https://cdn.example.com/avatar/johndoe.jpg"
 *                 role: user
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             example:
 *               success: false
 *               status: "not found"
 *               statusCode: 404
 *               message: "User not found"
 *               errors: null
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
 * /users/me:
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information. At least one field must be provided.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserSchema'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "User profile updated successfully."
 *               data:
 *                 id: "4fae1234-b678-433e-aaaa-17faae0cf1b2"
 *                 username: janedoe
 *                 firstName: Jane
 *                 lastName: Doe
 *                 bio: "I build APIs."
 *                 avatarUrl: "https://cdn.example.com/avatar/janedoe.jpg"
 *       400:
 *         description: Bad request - validation error or empty body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               validationError:
 *                 summary: Schema validation error
 *                 value:
 *                   success: false
 *                   status: "bad request"
 *                   statusCode: 400
 *                   message: "Validation Error: 1 errors occurred"
 *                   errors: [
 *                     {
 *                       "field": "username",
 *                       "message": "Username can only contain letters, numbers, and underscores"
 *                     }
 *                   ]
 *               emptyBody:
 *                 summary: Empty request body
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "At least one field must be provided for update"
 *                   errors: null
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             example:
 *               success: false
 *               status: "not found"
 *               statusCode: 404
 *               message: "User not found"
 *               errors: null
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
 *               $ref: '#/components/schemas/SimpleSuccessResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "User successfully deleted."
 *               data: null
 *       401:
 *         description: Unauthorized - Invalid or missing token
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

module.exports = router;
