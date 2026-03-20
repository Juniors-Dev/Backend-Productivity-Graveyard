const { verifyToken } = require("../utilities/jwt");
const { createError, normalizeError } = require("../utilities");

async function authenticate(req, res, next) {
  try {
    const auth = req.headers["authorization"];

    if (!auth) {
      throw createError({ statusCode: 401, message: "Unauthorized, token not found." });
    }

    const token = auth.split(" ");

    if (!token || token[0] !== "Bearer" || token.length !== 2) {
      throw createError({ statusCode: 401, message: "Unauthorized, invalid token format." });
    }

    const decoded = verifyToken(token[1]); // This will now throw specific errors for expired or invalid tokens.
    req.user = decoded;
    next();
  } catch (error) {
    next(normalizeError(error));
  }
}

/**
 * Middleware to check if the user is logged in
 */
async function isLoggedIn(req, res, next) {
  try {
    const auth = req.headers["authorization"];

    if (!auth) {
      return next();
    }

    return authenticate(req, res, next);
  } catch (error) {
    next(normalizeError(error));
  }
}

const hasRole = (role) => (req, res, next) => {
  if (!req.user) {
    throw createError({ statusCode: 401, message: "Unauthorized, token not found." });
  }
  if (req.user.role !== role) {
    throw createError({ statusCode: 403, message: "Forbidden, you do not own this entity." });
  }
  next();
};

module.exports = { authenticate, isLoggedIn, hasRole };
