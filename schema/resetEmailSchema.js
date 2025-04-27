const yup = require("yup");

const resetEmailSchema = yup.object({
  email: yup.string().email("Please provide a valid email").required("New email is required"),
});

module.exports = { resetEmailSchema };
