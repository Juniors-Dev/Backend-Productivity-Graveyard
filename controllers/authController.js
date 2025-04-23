const { db } = require("../models");
const UserService = require("../services/UserService");
const userService = new UserService(db);
const { hashPassword, verifyPassword } = require("../utilities/hashing");
const RoleService = require("../services/RoleService");
const roleService = new RoleService(db);
const { generateToken, verifyToken } = require("../utilities/jwt");

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
    throw new Error("Failed to create user");
  }
  res.status(201).json({ status: "success", statusCode: 201, data: { result: "Account created." } });
}

async function login(req, res) {
  // retrieving input
  const { email, password } = req.body;

  // finding the user - note we pass false to include the password fields
  const user = await userService.getOneEmail(email, false, false);

  //Cheking if the user exist
  if (!user) {
    throw new Error("No user with this Email exist");
  }

  //cheking if the user is soft deleted
  if (user.deletedAt) {
    return res.status(403).json({
      status: "forbidden",
      statusCode: 403,
      data: { result: "This account has been deleted or deactivated." },
    });
  }

  // verifying the user - use hashedPassword instead of encryptedPassword
  const verifyUser = await verifyPassword(password, user.salt, user.hashedPassword);

  if (!verifyUser) {
    return res.status(401).json({
      status: "unauthorized",
      statusCode: 401,
      data: { result: "Invalid password, please try again." },
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

module.exports = { register, login };
