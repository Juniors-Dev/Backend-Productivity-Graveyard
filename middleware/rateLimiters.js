const rateLimit = require("express-rate-limit");

// Limit login attempts: max 5 per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    status: "error",
    statusCode: 429,
    data: {
      result: "Too many login attempts. Please try again after 15 minutes.",
    },
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

//  Limit password reset requests: max 3 per 15 minutes
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    status: "error",
    statusCode: 429,
    data: {
      result: "Too many password reset requests. Please try again after 15 minutes.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit email reset/change requests: max 3 per 15 minutes
const emailResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    status: "error",
    statusCode: 429,
    data: {
      result: "Too many email change requests. Please try again after 15 minutes.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  passwordResetLimiter,
  emailResetLimiter,
};
