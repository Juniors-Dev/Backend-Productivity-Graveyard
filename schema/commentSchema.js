const { object, string, number } = require("yup");

const createCommentSchema = object({
  message: string()
    .required("Comment is required")
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long (maximum 2000 characters)"),
  parentId: number().nullable().integer().positive(),
});

const updateCommentSchema = object({
  message: string()
    .required("Comment is required")
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long (maximum 2000 characters)"),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
};
