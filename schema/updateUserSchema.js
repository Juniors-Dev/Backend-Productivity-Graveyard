const yup = require("yup");

const updateUserSchema = yup.object({
  firstName: yup
    .string()
    .max(15, "First name must be at most 15 characters")
    .min(2, "First name must be at least 2 characters"),
  lastName: yup
    .string()
    .max(15, "Last name must be at most 15 characters")
    .min(2, "Last name must be at least 2 characters"),
  username: yup
    .string()
    .max(15, "Username must be at most 15 characters")
    .min(2, "Username must be at least 2 characters"),
});

module.exports = { updateUserSchema };
