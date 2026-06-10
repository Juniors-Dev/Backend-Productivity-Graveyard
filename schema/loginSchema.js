const yup = require("yup");

const loginSchema = yup
  .object({
    email: yup.string().email("Please provide a valid email").required("Email is required"),
    password: yup.string().required("Please provide a valid password"),
  })
  .noUnknown(true, "Unknown field in request body");

module.exports = { loginSchema };
