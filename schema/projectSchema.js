const { object, string, array, number, date } = require("yup");

const projectSchema = object({
  name: string()
    .required("Name is required")
    .min(1, "Name can't be empty")
    .max(100, "Name must be under 100 characters"),
  description: string().required("Description is required").max(500, "Description must be under 500 characters"),
  eulogy: string().required("Eulogy is required").max(1000, "Eulogy must be under 1000 characters"),
  causeOfDeath: string().required("Cause of death is required").max(100, "Keep cause of death under 100 characters"),
  startDate: date()
    .required("Start date is required")
    .typeError("Start date must be a valid date")
    .transform((v, o) => (o === "" || o === undefined ? null : v)),

  endDate: date()
    .required("End date is required")
    .typeError("End date must be a valid date")
    .transform((v, o) => (o === "" || o === undefined ? null : v))
    .when("startDate", (start, schema) => {
      const startDate = new Date(start);
      return !isNaN(startDate) ? schema.min(startDate, "End date must be after start date") : schema;
    }),
  types: array()
    .of(number())
    .min(1, "At least one type must be selected")
    .test("unique", "Cannot contain duplicate types.", (value) =>
      value ? value.length === new Set(value)?.size : true
    )
    .required("Types are required"),
  tombstoneId: number("Tombstone ID must be a number").typeError("Tombstone ID must be a number").nullable(),
}).noUnknown(true, "Unknown field in request body");

const projectUpdateSchema = object()
  .shape({
    name: string().min(1, "Name can't be empty").max(100, "Name must be under 100 characters"),
    description: string().max(500, "Description must be under 500 characters"),
    eulogy: string().max(1000, "Eulogy must be under 1000 characters"),
    causeOfDeath: string().max(100, "Keep cause of death under 100 characters"),
    startDate: date()
      .nullable()
      .typeError("Start date must be a valid date")
      .transform((value, originalValue) => (originalValue === undefined ? null : value)),
    endDate: date()
      .nullable()
      .typeError("End date must be a valid date")
      .transform((value, originalValue) => (originalValue === undefined ? null : value))
      .when("startDate", (start, schema) => {
        const startDate = new Date(start);
        return !isNaN(startDate) ? schema.min(startDate, "End date must be after start date") : schema;
      }),
    tombstoneId: number("Tombstone ID must be a number").typeError("Tombstone ID must be a number").nullable(),
    status: string().oneOf(["inactive", "active", "buried", "completed", "archived"]),
  })
  .test("datesDependency", "Both startDate and endDate must be provided together", (value) => {
    const { startDate, endDate } = value;
    if ((startDate && !endDate) || (!startDate && endDate)) {
      return false;
    }
    return true;
  })
  .test("atLeastOneField", "At least one field must be provided for update", (value) => {
    return (
      value.name ||
      value.description ||
      value.eulogy ||
      value.causeOfDeath ||
      value.startDate ||
      value.endDate ||
      value.tombstoneId ||
      value.status
    );
  })
  .noUnknown(true, "Unknown field in request body");

const typeIdSchema = object({
  typeId: number().required("Type ID is required"),
}).noUnknown(true, "Unknown field in request body");

const resurrectSchema = object({
  reason: string()
    .required("Reason is required")
    .trim()
    .min(1, "Reason can't be empty")
    .max(255, "Reason must be under 255 characters"),
}).noUnknown(true, "Unknown field in request body");

module.exports = { projectSchema, projectUpdateSchema, typeIdSchema, resurrectSchema };
