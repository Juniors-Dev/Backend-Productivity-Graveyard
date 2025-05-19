const { object, string, number } = require("yup");

const projectIdSchema = object({
  projectId: string().uuid("Invalid projectId format").required("projectId is required"),
});

const commentIdSchema = object({
  id: number()
    .integer("Comment id must be an integer")
    .positive("Comment id must be a positive number")
    .required("Comment id is required"),
});

module.exports = { projectIdSchema, commentIdSchema };
