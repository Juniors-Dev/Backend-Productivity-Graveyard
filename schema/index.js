const { loginSchema } = require("./loginSchema");
const { registerSchema } = require("./registerSchema");
const { updateUserSchema } = require("./updateUserSchema");
const { projectIdSchema, commentIdSchema, uuidSchema } = require("./params");
const { projectSchema, projectUpdateSchema, typeIdSchema } = require("./projectSchema");
const { createCommentSchema, updateCommentSchema } = require("./commentSchema");
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
};
