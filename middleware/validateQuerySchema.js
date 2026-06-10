const { createError } = require("../utilities");

const validateQuerySchema = (schema) => async (req, res, next) => {
  try {
    req.query = await schema.validate(req.query, { abortEarly: false });
    next();
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = error.inner.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      throw createError({
        statusCode: 400,
        status: "bad request",
        message: `Validation Error: ${error.message}`,
        errors,
      });
    } else {
      throw createError({
        statusCode: 500,
        status: "error",
        message: "Internal Server Error",
      });
    }
  }
};

module.exports = validateQuerySchema;
