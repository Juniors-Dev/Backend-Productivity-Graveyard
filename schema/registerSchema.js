const yup = require("yup");

const registerSchema = yup.object({
  firstName: yup.string().required("First name is required").max(15, "First name must be at most 15 characters"),
  lastName: yup.string().required("Last name is required").max(15, "Last name must be at most 15 characters"),
  username: yup.string().required("Username is required").max(15, "Username must be at most 15 characters"),
  email: yup.string().email("Please provide a valid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .max(20, "Password must be at most 20 characters")
    .required("Password is required"),
});

module.exports = { registerSchema };
