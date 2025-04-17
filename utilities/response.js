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
