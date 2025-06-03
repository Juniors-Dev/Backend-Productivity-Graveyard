const { db } = require("../models");
const UserService = require("../services/UserService");
const userService = new UserService(db);
const RoleService = require("../services/RoleService");
const roleService = new RoleService(db);
const { generateToken, hashPassword, verifyPassword, createError } = require("../utilities");
const { generateEmailVerificationToken } = require("../utilities/emailToken");
const { loginLimiter } = require("../middleware/rateLimiters");

async function verifyEmail(req, res, next) {
  const token = req.query.token;

  if (!token) {
    throw new Error("No token provided");
  }

  const user = await userService.verifyEmailToken(token);

  if (!user) {
    throw new Error("Invalid or expired token");
  }

  res.status(200).json({ status: "success", message: "Email verified successfully." });
}

async function register(req, res) {
  const { firstName, lastName, username, email, password } = req.body;
  const { salt, hashedPassword } = await hashPassword(password);

  //Created a samll RoleService.
  const role = await roleService.getOneRole("user");

  //creating the inital user
  const user = await userService.create({
    firstName,
    lastName,
    username,
    displayName: username,
    email,
    hashedPassword,
    salt,
    roleId: role.id,
  });

  if (!user) {
    throw createError({
      status: "conflict",
      statusCode: 409,
      message: "Conflict, user not created.",
    });
  }

  res.status(201).json({ status: "success", statusCode: 201, data: { result: "Account created." } });
}

async function login(req, res) {
  // retrieving input
  const { email, password } = req.body;

  // finding the user - note we pass false to include the password fields
  const user = await userService.getOneEmail(email, false, false);

  //checking if the user exist
  if (!user) {
    throw createError({
      status: "unauthorized",
      statusCode: 401,
      message: "Invalid email or password, please try again.",
    });
  }

  // verifying the user - use hashedPassword instead of encryptedPassword
  const verifyUser = await verifyPassword(password, user.salt, user.hashedPassword);

  if (!verifyUser) {
    throw createError({
      status: "unauthorized",
      statusCode: 401,
      message: "Invalid password, please try again.",
    });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    username: user.username,
    roleId: user.roleId,
  });

  return res.status(200).json({
    status: "success",
    statusCode: 200,
    data: {
      result: "Login successful.",
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.Role.role,
      token,
    },
  });
}

module.exports = { register, login, verifyEmail };
