const { hashPassword, verifyPassword } = require("../utilities/hashing");
const createError = require("../utilities/createError");

class AuthService {
  constructor(db, tokenService) {
    this.client = db.sequelize;
    this.User = db.User;
    this.tokenService = tokenService;
  }

  async verifyEmail(plaintext) {
    const tokenRow = await this.tokenService.verify(plaintext, "email_verification");

    const user = await this.User.findByPk(tokenRow.userId);
    if (!user) {
      throw createError({ statusCode: 400, message: "Invalid or expired token." });
    }

    const transaction = await this.client.transaction();
    try {
      await user.update({ isEmailVerified: true }, { transaction });
      await this.tokenService.invalidateAll(tokenRow.userId, "email_verification", transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async resetPassword(plaintext, newPassword) {
    const tokenRow = await this.tokenService.verify(plaintext, "password_reset");

    const user = await this.User.findByPk(tokenRow.userId);
    if (!user) {
      throw createError({ statusCode: 400, message: "Invalid or expired token." });
    }

    const { hashedPassword, salt } = await hashPassword(newPassword);

    const transaction = await this.client.transaction();
    try {
      await user.update({ hashedPassword, salt }, { transaction });
      await this.tokenService.invalidateAll(tokenRow.userId, "password_reset", transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.User.findByPk(userId, {
      attributes: ["id", "hashedPassword", "salt"],
    });
    if (!user) {
      throw createError({ statusCode: 404, message: "User not found." });
    }

    const isValid = await verifyPassword(currentPassword, user.salt, user.hashedPassword);
    if (!isValid) {
      throw createError({ statusCode: 401, message: "Current password is incorrect." });
    }

    const { hashedPassword, salt } = await hashPassword(newPassword);

    const transaction = await this.client.transaction();
    try {
      await user.update({ hashedPassword, salt }, { transaction });
      await this.tokenService.invalidateAll(userId, "password_reset", transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = AuthService;
