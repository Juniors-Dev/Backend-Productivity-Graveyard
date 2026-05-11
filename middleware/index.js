const auth = require("./authentication");
const { createRateLimiter, createSlowDown } = require("./security");

module.exports = {
  asyncHandler: require("./asyncHandler"),
  authenticate: auth.authenticate,
  isLoggedIn: auth.isLoggedIn,
  hasRole: auth.hasRole,
  validateSchema: require("./validateSchema"),
  validateParamSchema: require("./validateParamSchema"),
  validateQuerySchema: require("./validateQuerySchema"),
  validateCredentials: require("./validateCredentials"),
  ownsEntity: require("./ownsEntity"),
  createRateLimiter,
  createSlowDown,
};
