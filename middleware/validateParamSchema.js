var { createError } = require("../utilities");

const validateParamSchema = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.params, { abortEarly: false });
    next();
  } catch (error) {
    console.log(error);
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

module.exports = validateParamSchema;
