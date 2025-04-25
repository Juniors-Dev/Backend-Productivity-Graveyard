const crypto = require("crypto");

function generateEmailToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 timer fra nå
  return { token, expires };
}

module.exports = {
  generateEmailToken,
};
