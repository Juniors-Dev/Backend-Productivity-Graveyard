function normalizeError(err) {
  if (err.statusCode && err.status) {
    return err;
  }

  const errorMap = {
    // JWT errors
    JsonWebTokenError: { message: "Unauthorized, invalid token.", code: 401 },
    TokenExpiredError: { message: "Unauthorized, token expired.", code: 401 },
    NotBeforeError: { message: "Unauthorized, token not active.", code: 401 },

    // Sequelize errors I think are relevant
    SequelizeDatabaseError: { message: "Internal Server Error, database error.", code: 500 },
    SequelizeUniqueConstraintError: { message: "Duplicate entry, this must be unique.", code: 400 },
    SequelizeValidationError: { message: "Validation failed.", code: 400 },
    SequelizeForeignKeyConstraintError: { message: "Invalid reference, check related data.", code: 400 },
    SequelizeConnectionError: { message: "Database connection failed.", code: 503 },

    // Validation yup errors
    ValidationError: { message: "Validation failed.", code: 400 },

    // Generic errors??
    SyntaxError: { message: "Invalid input syntax.", code: 400 },
    TypeError: {
      message: "Internal server error: type error.",
      code: 500,
    },
    ReferenceError: {
      message: "Internal server error: reference error.",
      code: 500,
    },
  };

  const match = errorMap[err.name];

  if (match) {
    return createError({
      message: match.message,
      statusCode: match.code,
      status: match.code >= 500 ? "error" : "fail",
      errors: err.errors || null,
    });
  }

  // Unknown errors, fallback to prevent unexpected generic errors
  return createError({
    message: err.message || "Unexpected error occurred.",
    statusCode: 500,
    status: "error",
    errors: null,
  });
}

module.exports = normalizeError;
