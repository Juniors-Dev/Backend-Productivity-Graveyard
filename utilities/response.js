/**
 * @param {Object} options
 * @param {string} options.message - The success message
 * @param {any} options.data - The data to be returned
 * @param {any} options.meta - Additional metadata
 * @param {number} options.statusCode - The HTTP status code
 * @description This function is used to create a success response object
 * @returns {Object} The success response object
 */
function successResponse({ message = "OK", data = null, meta = null, statusCode = 200 }) {
  return {
    success: true,
    status: "success",
    statusCode,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
}

/**
 * @param {Object} options
 * @param {string} options.message - The error message
 * @param {string} options.status - The error status
 * @param {number} options.statusCode - The HTTP status code
 * @param {any} options.errors - Additional error details either as an array or object
 * @description This function is used to create an error response object
 * @returns {Object} The error response object
 */
function errorResponse({ message = "An error occurred", status = "error", statusCode = 500, errors = null }) {
  return {
    success: false,
    status,
    statusCode,
    message,
    ...(errors ? { errors } : {}),
  };
}

module.exports = {
  successResponse,
  errorResponse,
};
