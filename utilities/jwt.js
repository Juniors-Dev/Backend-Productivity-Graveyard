var jwt = require("jsonwebtoken");
require("dotenv").config();

function generateToken(data) {
  return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "2h" });
}

function verifyToken(token) {
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
