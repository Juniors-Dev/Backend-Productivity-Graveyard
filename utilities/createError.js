function getStatusFromCode(code) {
  if (code >= 400 && code < 500) return "fail";
  if (code >= 500) return "error";
  return "success";
}

/**
 * @param {Object} options
 * @param {string} options.message - The error message
 * @param {string} options.status - The error status
 * @param {number} options.statusCode - The HTTP status code
 * @param {any} options.errors - Additional error details either as an array or object
 * @description This function is used to create an error object
 * @returns {Object} The error object
 * @example
 * const error = createError({
 * message: "Not Found",
 * status: "fail",
 * statusCode: 404,
 * errors: { result: "Resource not found" },
 * });
 */
function createError({ message = "Internal Server Error", status, statusCode = 500, errors = null }) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.status = status || getStatusFromCode(statusCode);
  err.errors = errors;
  return err;
}

module.exports = createError;
