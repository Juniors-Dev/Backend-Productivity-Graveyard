const express = require("express");
const router = express.Router();
const {
  validateSchema,
  asyncHandler,
  validateCredentials,
  createRateLimiter,
  createSlowDown,
} = require("../middleware");
const { loginSchema, registerSchema, verifyEmailSchema, emailSchema, resetPasswordSchema } = require("../schema");
const {
  login,
  register,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.use(
  createRateLimiter({
    max: parseInt(process.env.RATE_LIMIT_MAX) || 15,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000, // 10 minutes
    message: "Too many authentication attempts, please try again in 10 minutes.",
  })
);

router.use(
  createSlowDown({
    delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER) || 8,
    delayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS) || 500,
    windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS) || 5 * 60 * 1000, // 5 minutes
  })
);

router.post("/register", validateSchema(registerSchema), asyncHandler(validateCredentials), asyncHandler(register));
router.post("/login", validateSchema(loginSchema), asyncHandler(login));

router.post("/verify-email", validateSchema(verifyEmailSchema), asyncHandler(verifyEmail));
router.post("/resend-verification", validateSchema(emailSchema), asyncHandler(resendVerification));

router.post("/forgot-password", validateSchema(emailSchema), asyncHandler(forgotPassword));
router.post("/reset-password", validateSchema(resetPasswordSchema), asyncHandler(resetPassword));

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterSchema:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - username
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 30
 *           description: User's first name
 *           example: John
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 30
 *           description: User's last name
 *           example: Doe
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           description: User's unique username
 *           example: johndoe123
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 64
 *           description: User's password (must contain at least one uppercase letter, one lowercase letter, and one number)
 *           example: StrongPassword123
 *       additionalProperties: false
 *
 *     LoginSchema:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *           example: StrongPassword123
 *
 *     VerifyEmailSchema:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           pattern: "^[a-f0-9]{64}$"
 *           description: 64-character hex verification token received via email
 *           example: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
 *       additionalProperties: false
 *
 *     EmailSchema:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john.doe@example.com
 *       additionalProperties: false
 *
 *     ResetPasswordSchema:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         token:
 *           type: string
 *           description: Password reset token received via email
 *           example: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
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
 *     LoginDataResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "3f173b5c-8a0d-4e7f-90cb-4adf2b2c0001"
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         username:
 *           type: string
 *           example: johndoe123
 *         role:
 *           type: string
 *           example: user
 *         isEmailVerified:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           description: JWT access token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     AuthRateLimitResponse:
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
 *           example: 429
 *         message:
 *           type: string
 *           example: "Too many authentication attempts, please try again in 10 minutes."
 *         errors:
 *           type: null
 *           nullable: true
 *           example: null
 *       description: Authentication-specific rate limit response (15 requests per 10 minutes).
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends a verification email. The user must verify their email before full access is granted.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterSchema'
 *           example:
 *             firstName: John
 *             lastName: Doe
 *             username: johndoe123
 *             email: john.doe@example.com
 *             password: StrongPassword123
 *     responses:
 *       201:
 *         description: User created successfully. A verification email is sent (email delivery failures are silent — the user can resend via /auth/resend-verification).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleSuccessResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 201
 *               message: "Account created successfully. Please check your email to verify your account."
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               status: bad request
 *               statusCode: 400
 *               message: "Validation Error: 2 errors occurred"
 *               errors: [
 *                 {field: "email", message: "Email is required"},
 *                 {field: "password", message: "Password must be at least 8 characters"}
 *               ]
 *       409:
 *         description: Conflict - username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictResponse'
 *             example:
 *               success: false
 *               status: conflict
 *               statusCode: 409
 *               message: "Conflict, username already exists. Login or use a different username."
 *               errors: null
 *       429:
 *         description: Too many authentication attempts - auth rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRateLimitResponse'
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
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns a JWT token with user details including email verification status.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginSchema'
 *           example:
 *             email: john.doe@example.com
 *             password: StrongPassword123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   $ref: '#/components/schemas/LoginDataResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "Login successful."
 *               data:
 *                 id: "3f173b5c-8a0d-4e7f-90cb-4adf2b2c0001"
 *                 email: john.doe@example.com
 *                 username: johndoe123
 *                 role: user
 *                 isEmailVerified: true
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               status: bad request
 *               statusCode: 400
 *               message: "Validation Error: Email is required"
 *               errors: [
 *                 {field: "email", message: "Email is required"},
 *                 {field: "password", message: "Please provide a valid password"}
 *               ]
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *             example:
 *               success: false
 *               status: fail
 *               statusCode: 401
 *               message: "Invalid email or password, please try again."
 *               errors: null
 *       429:
 *         description: Too many authentication attempts - auth rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRateLimitResponse'
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
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     description: Verifies a user's email address using the token sent during registration. The token is single-use and expires after 24 hours.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailSchema'
 *           example:
 *             token: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleSuccessResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "Email verified successfully."
 *       400:
 *         description: Invalid or expired token, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               invalidToken:
 *                 summary: Token is invalid, expired, or already used
 *                 value:
 *                   success: false
 *                   status: "bad request"
 *                   statusCode: 400
 *                   message: "Invalid or expired token."
 *                   errors: null
 *               badFormat:
 *                 summary: Token format validation failed
 *                 value:
 *                   success: false
 *                   status: "bad request"
 *                   statusCode: 400
 *                   message: "Validation Error: 1 errors occurred"
 *                   errors: [
 *                     {field: "token", message: "Invalid token format"}
 *                   ]
 *       429:
 *         description: Too many authentication attempts - auth rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRateLimitResponse'
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
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Sends a new verification email if the address is registered and unverified. Always returns 200 regardless of whether the email exists to prevent email enumeration.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailSchema'
 *           example:
 *             email: john.doe@example.com
 *     responses:
 *       200:
 *         description: Request processed (always returns success to prevent email enumeration)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleSuccessResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "If that email is registered and unverified, a verification link has been sent."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               status: "bad request"
 *               statusCode: 400
 *               message: "Validation Error: 1 errors occurred"
 *               errors: [
 *                 {field: "email", message: "Please provide a valid email"}
 *               ]
 *       429:
 *         description: Rate limited - either auth rate limit, per-user cooldown, or daily email limit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRateLimitResponse'
 *             examples:
 *               authRateLimit:
 *                 summary: Auth route rate limit (15 req / 10 min)
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 429
 *                   message: "Too many authentication attempts, please try again in 10 minutes."
 *               cooldown:
 *                 summary: Per-user cooldown (5 minutes between emails)
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 429
 *                   message: "Please wait before requesting another email."
 *               dailyLimit:
 *                 summary: Daily email limit reached (5 per day)
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 429
 *                   message: "Daily email limit reached. Please try again later."
 *         headers:
 *           Retry-After:
 *             description: Seconds until next request is allowed (present on cooldown only, not on daily limit or auth rate limit)
 *             schema:
 *               type: integer
 *               example: 240
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalErrorResponse'
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset email if the address is registered. Always returns 200 regardless of whether the email exists to prevent email enumeration. Reset link is valid for 30 minutes.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailSchema'
 *           example:
 *             email: john.doe@example.com
 *     responses:
 *       200:
 *         description: Request processed (always returns success to prevent email enumeration)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleSuccessResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "If that email is registered, a password reset link has been sent."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               status: "bad request"
 *               statusCode: 400
 *               message: "Validation Error: 1 errors occurred"
 *               errors: [
 *                 {field: "email", message: "Please provide a valid email"}
 *               ]
 *       429:
 *         description: Rate limited - either auth rate limit, per-user cooldown, or daily email limit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRateLimitResponse'
 *             examples:
 *               authRateLimit:
 *                 summary: Auth route rate limit (15 req / 10 min)
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 429
 *                   message: "Too many authentication attempts, please try again in 10 minutes."
 *               cooldown:
 *                 summary: Per-user cooldown (5 minutes between emails)
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 429
 *                   message: "Please wait before requesting another email."
 *               dailyLimit:
 *                 summary: Daily email limit reached (5 per day)
 *                 value:
 *                   success: false
 *                   status: "fail"
 *                   statusCode: 429
 *                   message: "Daily email limit reached. Please try again later."
 *         headers:
 *           Retry-After:
 *             description: Seconds until next request is allowed (present on cooldown only, not on daily limit or auth rate limit)
 *             schema:
 *               type: integer
 *               example: 240
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalErrorResponse'
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: Resets the user's password using a valid reset token from the forgot-password email. The token is single-use and expires after 30 minutes.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordSchema'
 *           example:
 *             token: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
 *             newPassword: NewStrongPassword123
 *             confirmPassword: NewStrongPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleSuccessResponse'
 *             example:
 *               success: true
 *               status: success
 *               statusCode: 200
 *               message: "Password reset successfully."
 *       400:
 *         description: Invalid or expired token, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               invalidToken:
 *                 summary: Token is invalid, expired, or already used
 *                 value:
 *                   success: false
 *                   status: "bad request"
 *                   statusCode: 400
 *                   message: "Invalid or expired token."
 *                   errors: null
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
 *       429:
 *         description: Too many authentication attempts - auth rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRateLimitResponse'
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
