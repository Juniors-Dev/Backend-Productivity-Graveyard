var crypto = require("crypto");

async function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16);
  }
  const hashedPassword = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 310000, 32, "sha256", (err, hashedPassword) => {
      if (err) reject(err);
      resolve(hashedPassword);
    });
  });

  if (!salt) throw new Error("Failed to create salt");
  if (!hashedPassword) throw new Error("Failed to create hashed password");

  return { salt, hashedPassword };
}

async function verifyPassword(inputPassword, storedSalt, storedPassword) {
  try {
    const { hashedPassword } = await hashPassword(inputPassword, storedSalt);
    if (!crypto.timingSafeEqual(storedPassword, hashedPassword)) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
