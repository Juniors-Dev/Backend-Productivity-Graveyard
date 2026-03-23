const yup = require("yup");

const updateUserSchema = yup
  .object({
    firstName: yup
      .string()
      .max(30, "First name must be at most 30 characters")
      .min(2, "First name must be at least 2 characters")
      .optional(),
    lastName: yup
      .string()
      .max(30, "Last name must be at most 30 characters")
      .min(2, "Last name must be at least 2 characters")
      .optional(),
    username: yup
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
      .optional(),
    bio: yup.string().max(500, "Bio must be at most 500 characters").optional(),
    avatarUrl: yup.string().url("Must be a valid URL").optional(),
  })
  .strict(true)
  .noUnknown(true, "Unknown field in request body");

module.exports = { updateUserSchema };
