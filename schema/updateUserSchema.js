const yup = require("yup");

const updateUserSchema = yup.object({
  firstName: yup.string(),
  lastName: yup.string(),
  username: yup.string(),
});

module.exports = { updateUserSchema };
