var jwt = require("jsonwebtoken");
require("dotenv").config();
var createError = require("./createError");

function generateToken(data) {
  return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "2h" });
}

function verifyToken(token) {
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw createError({ statusCode: 401, status: "fail", message: "Unauthorized, token has expired." });
    }
    throw createError({ statusCode: 401, status: "fail", message: "Unauthorized, invalid or expired token." });
  }
}

module.exports = { generateToken, verifyToken };
