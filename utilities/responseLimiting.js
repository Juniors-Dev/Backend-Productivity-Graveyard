const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { errorResponse } = require("./response");

/**
 * Creates a rate limiter middleware for Express.js.
 * @param {Object} options - Configuration options for the rate limiter.
 * @param {number} options.max - Maximum number of requests allowed within the window.
 * @param {number} options.windowMs - Time window in milliseconds for the rate limit.
 * @param {string} [options.message] - Custom message to return when the limit is exceeded.
 * @returns {Function} The rate limiter middleware function.
 */
const createRateLimiter = ({ max, windowMs, message }) => {
  return rateLimit({
    windowMs,
    max,
    handler: (req, res) => {
      return res.status(429).json(
        errorResponse({
          statusCode: 429,
          message: message || "Too many requests, try again later.",
        })
      );
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Creates a slowdown middleware for Express.js.
 * @param {Object} options - Configuration options for the slowdown.
 * @param {number} options.delayAfter - Number of requests after which to start slowing down.
 * @param {number} options.delayMs - Delay in milliseconds to apply after the threshold is reached.
 * @param {number} options.windowMs - Time window in milliseconds for the slowdown.
 * @returns {Function} The slowdown middleware function.
 */
const createSlowDown = ({ delayAfter, delayMs, windowMs }) => {
  return slowDown({
    windowMs,
    delayAfter,
    delayMs,
  });
};

module.exports = {
  createRateLimiter,
  createSlowDown,
};
