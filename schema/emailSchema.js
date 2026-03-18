const yup = require("yup");

const verifyEmailSchema = yup
  .object({
    token: yup
      .string()
      .matches(/^[a-f0-9]{64}$/, "Invalid token format")
      .required("Verification token is required"),
  })
  .strict()
  .noUnknown(true, "Unknown field in request body");

const emailSchema = yup
  .object({
    email: yup.string().email("Please provide a valid email").required("Email is required"),
  })
  .strict()
  .noUnknown(true, "Unknown field in request body");

module.exports = { verifyEmailSchema, emailSchema };
