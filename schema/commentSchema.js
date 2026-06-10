const { object, string, number } = require("yup");

const createCommentSchema = object({
  message: string()
    .required("Comment is required")
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long (maximum 2000 characters)"),
  parentId: number().nullable().integer().positive(),
}).noUnknown(true, "Unknown field in request body");

const updateCommentSchema = object({
  message: string()
    .required("Comment is required")
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long (maximum 2000 characters)"),
}).noUnknown(true, "Unknown field in request body");

module.exports = {
  createCommentSchema,
  updateCommentSchema,
};
