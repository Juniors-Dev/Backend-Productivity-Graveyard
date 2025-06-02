const { loginSchema } = require("./loginSchema");
const { registerSchema } = require("./registerSchema");
const { updateUserSchema } = require("./updateUserSchema");
const { projectIdSchema, commentIdSchema, uuidSchema } = require("./params");
const { projectSchema, projectUpdateSchema, typeIdSchema } = require("./projectSchema");

module.exports = {
  loginSchema,
  registerSchema,
  updateUserSchema,
  projectIdSchema,
  commentIdSchema,
  uuidSchema,
  projectSchema,
  projectUpdateSchema,
  typeIdSchema,
};
