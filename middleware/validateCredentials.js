const { db } = require("../models");
const UserService = require("../services/UserService");
const userService = new UserService(db);
const { createError } = require("../utilities");

async function validateCredentials(req, res, next) {
  const { username, email } = req.body;

  if (username) {
    const existingUsername = await userService.getOneUsername(username);
    if (existingUsername) {
      throw createError({
        statusCode: 409,
        status: "conflict",
        message: "Conflict, username already exists. Login or use a different username.",
      });
    }
  }

  if (email) {
    const existingUserEmail = await userService.getOneEmail(email);
    if (existingUserEmail) {
      throw createError({
        statusCode: 409,
        status: "conflict",
        message: "Conflict, email already exists. Login or use a different email.",
      });
    }
  }

  next();
}

module.exports = validateCredentials;
