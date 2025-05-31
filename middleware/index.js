const auth = require("./authentication");
const { createRateLimiter, createSlowDown } = require("./security");

module.exports = {
  asyncHandler: require("./asyncHandler"),
  authenticate: auth.authenticate,
  isLoggedIn: auth.isLoggedIn,
  hasRole: auth.hasRole,
  isAdmin: auth.isAdmin,
  validateSchema: require("./validateSchema"),
  validateParamSchema: require("./validateParamSchema"),
  validateCredentials: require("./validateCredentials"),
  ownsEntity: require("./ownsEntity"),
  createRateLimiter,
  createSlowDown,
};
