const yup = require("yup");

const VALID_STATUSES = ["inactive", "active", "buried", "resurrected", "completed", "archived"];
const VALID_ORDER_BY = ["createdAt", "updatedAt", "name", "status", "startDate", "endDate"];
const VALID_ORDER = ["ASC", "DESC"];

const projectQuerySchema = yup.object({
  status: yup.string().oneOf(VALID_STATUSES, "Invalid status value").optional(),
  orderBy: yup.string().oneOf(VALID_ORDER_BY, "Invalid orderBy field").optional(),
  order: yup.string().oneOf(VALID_ORDER, "Must be ASC or DESC").optional(),
  userId: yup.string().uuid("userId must be a valid UUID").optional(),
  types: yup
    .string()
    .matches(/^\d+(,\d+)*$/, "types must be comma-separated integers")
    .optional(),
  query: yup.string().max(200, "query must be 200 characters or less").optional(),
});

module.exports = { projectQuerySchema };
