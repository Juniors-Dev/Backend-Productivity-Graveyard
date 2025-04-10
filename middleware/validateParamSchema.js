const validateParamSchema = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.params, { abortEarly: false });
    next();
  } catch (error) {
    console.log(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: "bad request",
        statusCode: 400,
        data: { result: `Validation Error: ${error.message}`, errors: error.errors },
      });
    } else {
      // probably going to happen when passing invalid schema
      return res.status(500).json({
        status: "internal server error",
        statusCode: 500,
        data: { result: `Internal Server Error: ${error.message}` },
      });
    }
  }
};

module.exports = validateParamSchema;
