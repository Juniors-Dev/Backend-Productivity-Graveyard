const yup = require("yup");

const newPasswordFields = {
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be at most 64 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Password confirmation is required"),
};

const updatePasswordSchema = yup
  .object({ currentPassword: yup.string().required("Current password is required"), ...newPasswordFields })
  .strict()
  .noUnknown(true, "Unknown field in request body");

const resetPasswordSchema = yup
  .object({ token: yup.string().required("Reset token is required"), ...newPasswordFields })
  .strict()
  .noUnknown(true, "Unknown field in request body");

module.exports = { updatePasswordSchema, resetPasswordSchema, forgotPasswordSchema };
