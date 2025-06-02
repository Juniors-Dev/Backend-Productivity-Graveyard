var express = require("express");
var router = express.Router();
var { login, register } = require("../controllers/authController");
var { validateSchema, asyncHandler, validateCredentials, createRateLimiter, createSlowDown } = require("../middleware");
const { loginSchema, registerSchema, updateUserSchema } = require("../schema");

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
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (must be at least 8 characters, contain uppercase, lowercase, and numbers)
 *           example: StrongPassword123
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
 *     UpdateUserSchema:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         username:
 *           type: string
 *           description: User's unique username
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
 *               example: ["Last name is required", "Password must be at least 8 characters"]
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [success]
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             result:
 *               type: string
 *               example: Account created successfully
 *             token:
 *               type: string
 *               description: JWT token for authenticated requests
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTYxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
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
 * /auth:
 *   get:
 *     summary: Welcome endpoint
 *     description: Returns a welcome message
 *     tags: [Auth]
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
 *         description: Too many requests - global rate limit exceeded
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

router.get("/", function (req, res, next) {
  res.status(200).json({ message: "Welcome to the API" });
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with the provided information
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
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               status: success
 *               data:
 *                 result: Account created successfully
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: bad request
 *               data:
 *                 errors: ["Last name is required", "Password must be at least 8 characters"]
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

router.post("/register", validateSchema(registerSchema), asyncHandler(validateCredentials), asyncHandler(register));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns a JWT token
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
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               status: success
 *               data:
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTYxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: bad request
 *               data:
 *                 errors: ["Please provide a valid email"]
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: unauthorized
 *               data:
 *                 errors: ["Invalid email or password"]
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

router.post("/login", validateSchema(loginSchema), asyncHandler(login));

module.exports = router;
