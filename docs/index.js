/**
 * @swagger
 * components:
 *   schemas:
 *
 * #-------------------------------
 * # Reusable Error Responses
 * #-------------------------------
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
 *       description: "Success response for operations that don't return data"
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

/**
 * @swagger
 * components:
 *   parameters:
 *
 * #-------------------------------
 * # Reusable operation parameters
 * #-------------------------------
 *
 *   limitParam:
 *     name: limit
 *     in: query
 *     required: false
 *     description: Number of items to return (1–100). Defaults to 100.
 *     schema:
 *       type: integer
 *       minimum: 1
 *       maximum: 100
 *       default: 100
 *
 *     offsetParam:
 *       name: offset
 *       in: query
 *       required: false
 *       description: Number of items to skip. Defaults to 0.
 *       schema:
 *         type: integer
 *         minimum: 0
 *         default: 0
 */
