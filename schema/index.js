const { loginSchema } = require("./loginSchema");
const { registerSchema } = require("./registerSchema");
const { updateUserSchema } = require("./updateUserSchema");
const { projectIdSchema, commentIdSchema, uuidSchema } = require("./params");
const { projectSchema, projectUpdateSchema, typeIdSchema } = require("./projectSchema");
const { createCommentSchema, updateCommentSchema } = require("./commentSchema");
const { updatePasswordSchema, resetPasswordSchema, forgotPasswordSchema } = require("./passwordSchema");
const { verifyEmailSchema, resetEmailSchema } = require("./emailSchema");
module.exports = {
  loginSchema,
  registerSchema,
  updateUserSchema,
  createCommentSchema,
  updateCommentSchema,
  projectIdSchema,
  commentIdSchema,
  uuidSchema,
  projectSchema,
  projectUpdateSchema,
  typeIdSchema,
  updatePasswordSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  resetEmailSchema,
};
