var { object, string, array, number, date } = require("yup");

const projectSchema = object({
  name: string().required("Name is required"),
  description: string().required("Description is required"),
  eulogy: string().required("Eulogy is required"),
  causeOfDeath: string().required("Cause of death is required"),
  startDate: date().required("Start date is required").typeError("Start date must be a valid date"),
  endDate: date()
    .required("End date is required")
    .typeError("End date must be a valid date")
    .when("startDate", (startDate, schema) =>
      startDate ? schema.min(startDate, "End date must be after start date") : schema
    ),
  types: array().of(number()).required("Types are required"),
  tombstoneId: string().nullable(),
});

const projectUpdateSchema = object({
  name: string(),
  description: string(),
  eulogy: string(),
  causeOfDeath: string(),
  startDate: date().typeError("Start date must be a valid date"),
  endDate: date()
    .typeError("End date must be a valid date")
    .when("startDate", (startDate, schema) =>
      startDate ? schema.min(startDate, "End date must be after start date") : schema
    ),
  tombstoneId: string().nullable(),
  status: string().oneOf(["inactive", "active", "buried", "resurrected", "completed", "archived"]),
});

const typeIdSchema = object({
  typeId: number().required("Type ID is required"),
});

module.exports = { projectSchema, projectUpdateSchema, typeIdSchema };
