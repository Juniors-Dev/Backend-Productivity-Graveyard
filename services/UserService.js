const { Op } = require("sequelize");
const sanitizeUser = require("../utilities/sanitizeUser");
const { generateEmailToken } = require("../utilities/emailToken");
const { sendVerificationEmail, sendPasswordResetEmail, sendEmailChangeVerification } = require("./emailService");
const { isEmailRateLimited } = require("../utilities/emailRateLimiter");

class UserService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
    this.Role = db.Role;
  }

  async getAll() {
    return this.User.findAll({
      include: [{ model: this.Role }],
      attributes: { exclude: ["encryptedPassword", "salt", "roleId"] },
    });
  }

  async getOneEmail(email, exclude = true, paranoid = true) {
    return this.User.findOne({
      where: { email },
      include: [{ model: this.Role }],
      attributes: {
        exclude: exclude ? ["hashedPassword", "salt", "roleId"] : [],
      },
      paranoid, // if paranoid is false, deletedAt will be null
    });
  }

  async getOneUsername(username) {
    return this.User.findOne({
      where: { username },
      include: [{ model: this.Role }],
      attributes: { exclude: ["encryptedPassword", "salt", "roleId"] },
    });
  }

  async getOneId(userId, options = {}) {
    const user = await this.User.findOne({
      where: { id: userId },
      include: [{ model: this.Role }],
      attributes: { exclude: ["hashedPassword", "salt", "roleId"] },
    });

    if (!user) return null;

    return sanitizeUser(user, options);
  }

  async create({ firstName, lastName, username, email, hashedPassword, salt, roleId }) {
    const { token, expires } = generateEmailToken();

    const user = await this.User.create({
      firstName,
      lastName,
      username,
      displayName: username,
      email,
      hashedPassword,
      salt,
      roleId,
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      isEmailVerified: false,
    });

    if (isEmailRateLimited(email)) {
      return true;
    }
    await sendVerificationEmail(user.email, token);

    return user;
  }

  async update(id, args) {
    const updated = await this.User.update(
      { ...args },
      {
        where: { id },
      }
    );

    const updatedUser = await this.getOneId(id);
    return updatedUser;
  }

  async softDelete(id) {
    const user = await this.User.findByPk(id, {
      include: [{ model: this.Role }],
    });

    if (!user) {
      return null;
    }

    let transaction;
    try {
      transaction = await this.client.transaction();
      await user.destroy({ transaction });
      await transaction.commit();

      return true;
    } catch (error) {
      if (transaction) await transaction.rollback();
      throw error;
    }
  }

  async getAllDeleted() {
    return this.User.findAll({
      where: {
        deletedAt: {
          [Op.ne]: null,
        },
      },
      paranoid: false,
    });
  }

  async restore(id) {
    return this.User.restore({ where: { id } });
  }

  async verifyEmailToken(token) {
    const user = await this.User.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user || user.emailVerificationExpires < new Date()) {
      return null;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return user;
  }

  async verifyPasswordToken(token) {
    const user = await this.User.findOne({
      where: { passwordResetToken: token },
    });

    if (!user || user.passwordResetExpires < new Date()) {
      return null;
    }

    return user; // Just return — let the next step update password
  }

  async resetPassword(token, hashedPassword, salt) {
    const user = await this.User.findOne({
      where: { passwordResetToken: token },
    });

    if (!user || user.passwordResetExpires < new Date()) {
      throw new Error("Invalid or expired reset token");
    }

    user.hashedPassword = hashedPassword;
    user.salt = salt;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();
    return user;
  }

  async requestPasswordReset(email) {
    //So that the email dosent get spammed
    if (isEmailRateLimited(email)) {
      return true;
    }
    const user = await this.User.findOne({ where: { email } });

    if (user) {
      const { token, expires } = generateEmailToken();
      user.passwordResetToken = token;
      user.passwordResetExpires = expires;
      await user.save();
      await sendPasswordResetEmail(user.email, token);
    }

    // Always return silently to avoid revealing if user exists
    return true;
  }

  async resetEmail(token) {
    const user = await this.User.findOne({
      where: { emailChangeToken: token },
    });

    if (!user || user.emailChangeExpires < new Date()) {
      throw new Error("Invalid or expired email change token");
    }

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailChangeToken = null;
    user.emailChangeExpires = null;

    await user.save();
    return user;
  }

  async requestEmailChange(userId, newEmail) {
    if (isEmailRateLimited(email)) {
      return true;
    }
    const user = await this.User.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    const { token, expires } = generateEmailToken();

    user.pendingEmail = newEmail;
    user.emailChangeToken = token;
    user.emailChangeExpires = expires;

    await user.save();

    await sendEmailChangeVerification(newEmail, token);
  }
}

module.exports = UserService;
