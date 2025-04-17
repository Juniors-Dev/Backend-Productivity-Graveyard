const auth = require("./authentication");

module.exports = {
  asyncHandler: require("./asyncHandler"),
  authenticate: auth.authenticate,
  hasRole: auth.hasRole,
  isAdmin: auth.isAdmin,
  validateSchema: require("./validateSchema"),
  validateParamSchema: require("./validateParamSchema"),
  validateCredentials: require("./validateCredentials"),
  ownEntity: require("./ownsEntity"),
};
