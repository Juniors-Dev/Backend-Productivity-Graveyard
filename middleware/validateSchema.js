var createError = require("../utilities/createError");
var { errorResponse } = require("../utilities/response.js");

const validateSchema = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.body, { abortEarly: false });
    next();
  } catch (error) {
    if (error.name === "ValidationError") {
      throw createError({
        statusCode: 400,
        status: "bad request",
        message: `Validation Error: ${error.message}`,
        errors: error.errors,
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
