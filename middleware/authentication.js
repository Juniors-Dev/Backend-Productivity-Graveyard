const { verifyToken } = require("../utilities/jwt");
const { db } = require("../models");
const UserService = require("../services/UserService");
const userService = new UserService(db);
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

const hasRole = (role) => async (req, res, next) => {
  try {
    if (!req.user) {
      throw createError({ statusCode: 401, message: "Unauthorized, token not found." });
    }

    const user = await userService.getOneId(req.user.id);

    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized, user not found." });
    }

    if (user.role !== role) {
      throw createError({ statusCode: 403, message: "Forbidden, insufficient permissions." });
    }
    req.user = user;
    next();
  } catch (error) {
    next(normalizeError(error));
  }
};

//Check if the visited user is itsself or Admin
const isSelfOrAdmin = async (req, res, next) => {
  try {
    const targetUser = req.params.id;
    const user = req.user;

    if (targetUser === user.id || user.Role.name === "admin") {
      return next();
    }

    throw createError({
      statusCode: 403,
      message: "Forbidden, you don't have permission to access this resource.",
    });
  } catch (error) {
    next(normalizeError(error));
  }
};

module.exports = { authenticate, isLoggedIn, hasRole, isAdmin, isSelfOrAdmin };
