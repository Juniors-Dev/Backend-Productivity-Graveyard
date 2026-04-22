const createError = require("../utilities/createError");

const validateSchema = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validate(req.body, { abortEarly: false });
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
        errors: errors,
        // errors: error.errors || [], // Ensure errors is an array
      });
    } else {
      // probably going to happen when passing invalid schema
      throw createError({
        statusCode: 500,
        status: "internal server error",
        message: `Internal Server Error: ${error.message}`,
      });
    }
  }
};

module.exports = validateSchema;
