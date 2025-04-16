const { UserServices, ProjectServices } = require("../services/index");
const { db } = require("../models");
const UserService = require("../services/UserService");
const userService = new UserService(db);
const projectServices = new ProjectServices(db);
const { hashPassword, verifyPassword } = require("../utilities/hashing");
const RoleService = require("../services/RoleServices");
const roleService = new RoleService(db);
const { generateToken } = require("../utilities/jwt");

async function register(req, res) {
  const { firstname, lastname, username, email, password } = req.body;
  const { salt, hashedPassword } = await hashPassword(password);

  //Created a samll RoleService.
  const role = await roleService.getOneRole("user");

  //creating the inital user
  const user = await userService.create({
    firstname,
    lastname,
    username,
    displayName: username,
    email,
    encryptedPassword: hashPassword,
    salt,
    roleId: role,
  });

  if (!user) {
    throw new Error("Failed to create user");
  }
  res.status(201).json({ status: "success", statusCode: 201, data: { result: "Account created." } });
}

async function login(req, res) {
  //retriving input
  const { email, password } = req.body;

  //finding the user
  const user = await userServices.getOneEmail(email, false);

  if (!user) {
    throw new Error("No user with this Email exist");
  }

  //verfying the user
  const verifyUser = await verifyPassword(password, user.salt, user.encryptedPassword);

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
