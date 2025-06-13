const { db } = require("../models");
const UserService = require("../services/UserService");
const userService = new UserService(db);
const RoleService = require("../services/RoleService");
const roleService = new RoleService(db);
const { generateToken, hashPassword, verifyPassword, createError, successResponse } = require("../utilities");

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
  res.status(201).json(
    successResponse({
      message: "Account created successfully.",
      statusCode: 201,
    })
  );
}

async function login(req, res) {
  // retrieving input
  const { email, password } = req.body;

  // finding the user - note we pass false to include the password fields
  const user = await userService.getOneEmail(email, false, false);

  //Cheking if the user exist
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

  res.status(200).json(
    successResponse({
      message: "Login successful.",
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.Role.name,
        token,
      },
      statusCode: 200,
    })
  );
}

module.exports = { register, login };
