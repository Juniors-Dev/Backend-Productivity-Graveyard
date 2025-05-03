var crypto = require("crypto");

async function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16);
  } else if (typeof salt === "string") {
    salt = Buffer.from(salt, "hex"); // for reuse during verification
  }

  const hashedPassword = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 310000, 32, "sha256", (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey);
    });
  });

  return {
    hashedPassword: hashedPassword.toString("hex"),
    salt: salt.toString("hex"),
  };
}

async function verifyPassword(inputPassword, storedSalt, storedPassword) {
  try {
    const { hashedPassword } = await hashPassword(inputPassword, storedSalt);
    if (!crypto.timingSafeEqual(Buffer.from(storedPassword, "hex"), Buffer.from(hashedPassword, "hex"))) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
