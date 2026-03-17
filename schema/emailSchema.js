const yup = require("yup");

const verifyEmailSchema = yup
  .object({
    token: yup.string().required("Verification token is required"),
  })
  .strict()
  .noUnknown(true, "Unknown field in request body");

const resetEmailSchema = yup.object({
  email: yup.string().email("Please provide a valid email").required("New email is required"),
});

module.exports = { verifyEmailSchema, resetEmailSchema };
