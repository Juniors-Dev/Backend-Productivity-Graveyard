/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   parameters:
 *     limitParam:
 *       name: limit
 *       in: query
 *       required: false
 *       description: "Number of items to return (1–100). Defaults to 100."
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 100
 *
 *     offsetParam:
 *       name: offset
 *       in: query
 *       required: false
 *       description: "Number of items to skip. Defaults to 0."
 *       schema:
 *         type: integer
 *         minimum: 0
 *         default: 0
 *
 *   headers:
 *     RateLimitHeaders:
 *       X-RateLimit-Limit:
 *         description: The number of allowed requests in the current period
 *         schema:
 *           type: integer
 *         example: 600
 *       X-RateLimit-Remaining:
 *         description: The number of remaining requests in the current period
 *         schema:
 *           type: integer
 *         example: 599
 *       X-RateLimit-Reset:
 *         description: The time at which the current rate limit window resets (UTC epoch seconds)
 *         schema:
 *           type: integer
 *         example: 1640995200
 *
 * #-------------------------------
 * # Reusable Error Responses
 * #-------------------------------
 *   schemas:
 *     RateLimitResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         status:
 *           type: string
 *           example: error
 *         statusCode:
 *           type: integer
 *           example: 429
 *         message:
 *           type: string
 *           example: "Too many requests, please try again later."
 *         errors:
 *           type: null
 *           nullable: true
 *           example: null
 *       description: Global rate limit response (600 requests per 10 minutes)
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
 *           example: "Validation Error: x errors occurred"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Username is required", "Email format is invalid"]
 *
 *     ApplicationErrorResponse:
 *       type: object
 *       description: "Error response for application logic errors with contextual information"
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
 *           example: "Cannot reply to a reply"
 *         errors:
 *           type: object
 *           additionalProperties: true
 *           example: { commentId: 123, parentId: 456 }
 *           description: "Additional context about the error"
 *           nullable: true
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
 *         errors:
 *           type: null
 *           nullable: true
 *           example: null
 *
 *     ForbiddenResponse:
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
 *           example: 403
 *         message:
 *           type: string
 *           example: "Forbidden, you do not own this entity."
 *         errors:
 *           type: null
 *           nullable: true
 *           example: null
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
 *           example: "x not found"
 *         errors:
 *           oneOf:
 *             - type: array
 *               items:
 *                 type: string
 *             - type: object
 *               additionalProperties: true
 *             - type: null
 *           nullable: true
 *           example: { projectId: "1234" }
 *
 *     InternalErrorResponse:
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
 *           example: "Internal server error"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *           example: null
 *
 * #-------------------------------
 * # Reusable Success Response
 * #-------------------------------
 *
 *     SimpleSuccessResponse:
 *       type: object
 *       description: Success response for operations that don't return data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         status:
 *           type: string
 *           example: "success"
 *         statusCode:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "x deleted successfully"
 */
