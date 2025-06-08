const yup = require("yup");

const updatePasswordSchema = yup
  .object({
    currentPassword: yup.string().required("Current password is required"),
    newPassword: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/,
        "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .required("New password is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("newPassword")], "Passwords must match")
      .required("Password confirmation is required"),
  })
  .strict()
  .noUnknown(true, "Unknown field in request body");

// Optional: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
// 8 char, at least one uppercase letter, one lowercase letter, one number

module.exports = { updatePasswordSchema };
