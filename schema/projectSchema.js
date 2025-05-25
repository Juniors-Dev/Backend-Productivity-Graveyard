var { object, string, array, number, date } = require("yup");

const projectSchema = object({
  name: string()
    .required("Name is required")
    .min(1, "Name can't be empty")
    .max(100, "Name must be under 100 characters"),
  description: string().required("Description is required").max(500, "Description must be under 500 characters"),
  eulogy: string().required("Eulogy is required").max(1000, "Eulogy must be under 1000 characters"),
  causeOfDeath: string().required("Cause of death is required").max(255, "Keep cause of death under 255 characters"),
  startDate: date().required("Start date is required").typeError("Start date must be a valid date"),
  endDate: date()
    .required("End date is required")
    .typeError("End date must be a valid date")
    .when("startDate", (startDate, schema) =>
      startDate ? schema.min(startDate, "End date must be after start date") : schema
    ),
  types: array().of(number()).min(1, "At least one type must be selected").required("Types are required"),
  tombstoneId: number().nullable(),
});

const projectUpdateSchema = object({
  name: string().min(1, "Name can't be empty").max(100, "Name must be under 100 characters"),
  description: string().max(500, "Description must be under 500 characters"),
  eulogy: string().max(1000, "Eulogy must be under 1000 characters"),
  causeOfDeath: string().max(255, "Keep cause of death under 255 characters"),
  startDate: date().typeError("Start date must be a valid date"),
  endDate: date()
    .typeError("End date must be a valid date")
    .when("startDate", (startDate, schema) =>
      startDate ? schema.min(startDate, "End date must be after start date") : schema
    ),
  tombstoneId: number().nullable(),
  status: string().oneOf(["inactive", "active", "buried", "resurrected", "completed", "archived"]),
});

const typeIdSchema = object({
  typeId: number().required("Type ID is required"),
});

module.exports = { projectSchema, projectUpdateSchema, typeIdSchema };
