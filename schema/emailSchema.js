const yup = require("yup");

const verifyEmailSchema = yup
  .object({
    token: yup.string().required("Verification token is required"),
  })
  .strict()
  .noUnknown(true, "Unknown field in request body");

module.exports = { verifyEmailSchema };
