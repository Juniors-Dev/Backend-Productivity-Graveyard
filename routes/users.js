const express = require("express");
const router = express.Router();
const { getUser, updateMe, getMe, softDeletedUser, changePassword } = require("../controllers/userController");
const { validateSchema, asyncHandler, authenticate } = require("../middleware");
const { updateUserSchema, updatePasswordSchema } = require("../schema");

router.get("/me", asyncHandler(authenticate), asyncHandler(getMe));
router.get("/:id", asyncHandler(getUser));
router.put("/me", asyncHandler(authenticate), validateSchema(updateUserSchema), asyncHandler(updateMe));
router.put(
  "/me/password",
  asyncHandler(authenticate),
  validateSchema(updatePasswordSchema),
  asyncHandler(changePassword)
);
router.delete("/me", asyncHandler(authenticate), asyncHandler(softDeletedUser));

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicUserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "a88c5e91-57e7-4121-872f-6b793a154f6c"
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         username:
 *           type: string
 *           example: johndoe123
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
 *
 *     OwnerUserResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/PublicUserResponse'
 *         - type: object
 *           properties:
 *             firstName:
 *               type: string
 *               example: John
 *             lastName:
 *               type: string
 *               example: Doe
 *             email:
 *               type: string
 *               format: email
 *               example: john.doe@example.com
 *             isEmailVerified:
 *               type: boolean
 *               example: true
 *
 *     SoftDeletedUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "a88c5e91-57e7-4121-872f-6b793a154f6c"
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
 *           maxLength: 30
 *           minLength: 2
 *           example: John
 *         lastName:
 *           type: string
 *           maxLength: 30
 *           minLength: 2
 *           example: Doe
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
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
 *     UpdatePasswordSchema:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: User's current password
 *           example: OldPassword123
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 64
 *           description: New password (must contain at least one uppercase letter, one lowercase letter, and one number)
 *           example: NewStrongPassword123
 *         confirmPassword:
 *           type: string
 *           format: password
 *           description: Must match newPassword
 *           example: NewStrongPassword123
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
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's full profile including projects and stats.
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
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/OwnerUserResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "Current user retrieved successfully."
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
 *                 isEmailVerified: true
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
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a user's public profile by their ID. Does not include owner-specific fields (email, firstName, lastName).
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID)
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
 *                   $ref: '#/components/schemas/PublicUserResponse'
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
 *                 createdAt: "2026-03-30T12:00:00Z"
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
 *     description: Update the authenticated user's profile information. At least one field must be provided. Returns the lean user object (no projects or stats).
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
 *                   $ref: '#/components/schemas/OwnerUserResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "User profile updated successfully."
 *               data:
 *                 id: "4fae1234-b678-433e-aaaa-17faae0cf1b2"
 *                 username: janedoe
 *                 fullName: Jane Doe
 *                 firstName: Jane
 *                 lastName: Doe
 *                 bio: "I build APIs."
 *                 avatarUrl: "https://cdn.example.com/avatar/janedoe.jpg"
 *                 role: user
 *                 isEmailVerified: true
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
 * /users/me/password:
 *   put:
 *     summary: Change password
 *     description: Change the authenticated user's password. Requires the current password for verification. Invalidates any outstanding password reset tokens.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordSchema'
 *           example:
 *             currentPassword: OldPassword123
 *             newPassword: NewStrongPassword123
 *             confirmPassword: NewStrongPassword123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleSuccessResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "Password updated successfully."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               weakPassword:
 *                 summary: Password does not meet requirements
 *                 value:
 *                   success: false
 *                   status: "bad request"
 *                   statusCode: 400
 *                   message: "Validation Error: 1 errors occurred"
 *                   errors: [
 *                     {field: "newPassword", message: "Password must be at least 8 characters"}
 *                   ]
 *               mismatch:
 *                 summary: Passwords do not match
 *                 value:
 *                   success: false
 *                   status: "bad request"
 *                   statusCode: 400
 *                   message: "Validation Error: 1 errors occurred"
 *                   errors: [
 *                     {field: "confirmPassword", message: "Passwords must match"}
 *                   ]
 *       401:
 *         description: Unauthorized - invalid or missing token, or wrong current password
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
 *               wrongPassword:
 *                 summary: Current password is incorrect
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 401
 *                   message: "Current password is incorrect."
 *                   errors: null
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
 *               message: "User not found."
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
