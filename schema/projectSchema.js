var { object, string, array, number } = require("yup");

const projectSchema = object({
  name: string().required("Name is required"),
  description: string().required("Description is required"),
  eulogy: string().required("Eulogy is required"),
  causeOfDeath: string().required("Cause of death is required"),
  startDate: string().required("Start date is required"),
  endDate: string().required("End date is required"),
  types: array().of(number()).required("Types are required"),
  tombstoneId: string().nullable(),
});

const projectUpdateSchema = object({
  name: string(),
  description: string(),
  eulogy: string(),
  causeOfDeath: string(),
  startDate: string(),
  endDate: string(),
  tombstoneId: string().nullable(),
  status: string().oneOf(["inactive", "active", "buried", "resurrected", "completed", "archived"]),
});

const typeIdSchema = object({
  typeId: number().required("Type ID is required"),
});

module.exports = { projectSchema, projectUpdateSchema, typeIdSchema };
