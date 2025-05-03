var { verifyToken } = require("../utilities/jwt");
var { db } = require("../models");
var UserService = require("../services/UserService");
var userService = new UserService(db);

async function authenticate(req, res, next) {
  try {
    const auth = req.headers["authorization"];

    if (!auth) {
      return res.status(401).json({
        status: "unauthorized",
        statusCode: 401,
        data: { result: "Unauthorized, token not found." },
      });
    }

    const token = auth.split(" ");

    if (!token || token[0] !== "Bearer" || token.length !== 2) {
      return res.status(401).json({
        status: "unauthorized",
        statusCode: 401,
        data: { result: "Unauthorized, invalid token." },
      });
    }

    const decoded = verifyToken(token[1]);
    if (!decoded) {
      return res.status(401).json({
        status: "unauthorized",
        statusCode: 401,
        data: { result: "Unauthorized, invalid or expired token." },
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", statusCode: 500, data: { result: error.message } });
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

    authenticate(req, res, next);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", statusCode: 500, data: { result: error.message } });
  }
}

const hasRole = (role) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "unauthorized",
        statusCode: 401,
        data: { result: "Unauthorized, token not found." },
      });
    }

    const user = await userService.getOneId(req.user.id);

    if (!user) {
      return res.status(401).json({
        status: "unauthorized",
        statusCode: 401,
        data: { result: "Unauthorized, invalid user." },
      });
    }

    if (user.Role.name !== role) {
      return res.status(403).json({
        status: "forbidden",
        statusCode: 403,
        data: { result: "Forbidden, invalid role." },
      });
    }
    req.user = user;

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", statusCode: 500, data: { result: error.message } });
  }
};

async function isAdmin(req, res, next) {
  try {
    const auth = req.headers["authorization"];
    if (!auth) {
      return next();
    }

    const token = auth.split(" ");
    if (token[0] !== "Bearer" || token.length !== 2) {
      return next();
    }

    const decoded = verifyToken(token[1]);
    if (!decoded) {
      return next();
    }

    const user = await userService.getOneId(decoded.id);
    if (!user) {
      return next();
    }

    if (user.Role.role !== "admin") {
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", statusCode: 500, data: { result: error.message } });
  }
}

//Check if the visited user is itsself or Admin
const isSelfOrAdmin = async (req, res, next) => {
  try {
    const targetUser = req.params.id;
    const user = req.user;

    if (targetUser === user.id || user.Role.role === "admin") {
      return next();
    }

    return res.status(403).json({
      status: "forbidden",
      statusCode: 403,
      data: { result: "Forbidden, must be self or admin." },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: "error", statusCode: 500, data: { result: e.message } });
  }
};

module.exports = { authenticate, isLoggedIn, hasRole, isAdmin, isSelfOrAdmin };
