var { db } = require("../models");
var UserService = require("../services/UserService");
var userService = new UserService(db);

async function validateCredentials(req, res, next) {
  const { username, email } = req.body;

  if (username) {
    const existingUsername = await userService.getOneUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        status: "conflict",
        statusCode: 409,
        data: { result: "Username already exists." },
      });
    }
  }

  if (email) {
    const existingUserEmail = await userService.getOneEmail(email);
    if (existingUserEmail) {
      return res.status(409).json({
        status: "conflict",
        statusCode: 409,
        data: { result: "Email already exists. Login or use a different email." },
      });
    }
  }

  next();
}

module.exports = validateCredentials;
