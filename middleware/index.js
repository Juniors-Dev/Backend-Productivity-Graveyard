const auth = require("./authentication");
const { loginLimiter, passwordResetLimiter, emailResetLimiter } = require("./rateLimiters");
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
  loginLimiter,
  passwordResetLimiter,
  emailResetLimiter,
  ownsEntity: require("./ownsEntity"),
  createRateLimiter,
  createSlowDown,
};
