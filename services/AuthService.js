const { Op } = require("sequelize");
const { generateToken, hashToken, hashPassword, verifyPassword } = require("../utilities/hashing");
const createError = require("../utilities/createError");

const TOKEN_EXPIRY_MS = new Map([
  ["email_verification", 24 * 60 * 60 * 1000],
  ["password_reset", 30 * 60 * 1000],
]);

const TOKEN_COOLDOWN_MS = new Map([
  ["email_verification", 5 * 60 * 1000],
  ["password_reset", 5 * 60 * 1000],
]);

const TOKEN_DAILY_LIMIT = new Map([
  ["email_verification", 5],
  ["password_reset", 5],
]);

class AuthService {
  constructor(db) {
    this.client = db.sequelize;
    this.Token = db.Token;
    this.User = db.User;
  }

  async _createToken(userId, type) {
    const expiryMs = TOKEN_EXPIRY_MS.get(type);
    if (!expiryMs) {
      throw new Error(`Unknown token type: ${type}`);
    }
    const { plaintext, hash } = generateToken();
    const expiresAt = new Date(Date.now() + expiryMs);
    await this.Token.create({
      userId,
      type,
      tokenHash: hash,
      expiresAt,
    });
    return { plaintext };
  }

  async _verifyToken(plaintext, type) {
    const hash = hashToken(plaintext);
    const tokenRow = await this.Token.findOne({
      where: {
        tokenHash: hash,
        type,
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    if (!tokenRow) {
      throw createError({ statusCode: 400, message: "Invalid or expired token." });
    }
    return tokenRow;
  }

  async _invalidateTokens(userId, type, transaction = null) {
    await this.Token.update(
      { usedAt: new Date() },
      {
        where: {
          userId,
          type,
          usedAt: null,
        },
        ...(transaction && { transaction }),
      }
    );
  }

  async _enforceTokenLimits(userId, type) {
    const cooldownMs = TOKEN_COOLDOWN_MS.get(type);
    const dailyLimit = TOKEN_DAILY_LIMIT.get(type);

    const recentToken = await this.Token.findOne({
      where: {
        userId,
        type,
        createdAt: { [Op.gt]: new Date(Date.now() - cooldownMs) },
      },
    });

    if (recentToken) {
      const retryAfterSeconds = Math.ceil((cooldownMs - (Date.now() - recentToken.createdAt.getTime())) / 1000);
      const error = createError({
        statusCode: 429,
        message: "Please wait before requesting another email.",
      });
      error.retryAfter = retryAfterSeconds;
      throw error;
    }

    const dailyCount = await this.Token.count({
      where: {
        userId,
        type,
        createdAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (dailyCount >= dailyLimit) {
      throw createError({
        statusCode: 429,
        message: "Daily email limit reached. Please try again later.",
      });
    }
  }

  async createVerificationToken(userId) {
    await this._enforceTokenLimits(userId, "email_verification");
    await this._invalidateTokens(userId, "email_verification");
    const { plaintext } = await this._createToken(userId, "email_verification");
    return plaintext;
  }

  async verifyEmail(plaintext) {
    const tokenRow = await this._verifyToken(plaintext, "email_verification");

    const user = await this.User.findByPk(tokenRow.userId);
    if (!user) {
      throw createError({ statusCode: 400, message: "Invalid or expired token." });
    }

    const transaction = await this.client.transaction();
    try {
      await user.update({ isEmailVerified: true }, { transaction });
      await this._invalidateTokens(tokenRow.userId, "email_verification", transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createPasswordResetToken(userId) {
    await this._enforceTokenLimits(userId, "password_reset");
    await this._invalidateTokens(userId, "password_reset");
    const { plaintext } = await this._createToken(userId, "password_reset");
    return plaintext;
  }

  async resetPassword(plaintext, newPassword) {
    const tokenRow = await this._verifyToken(plaintext, "password_reset");

    const user = await this.User.findByPk(tokenRow.userId);
    if (!user) {
      throw createError({ statusCode: 400, message: "Invalid or expired token." });
    }

    const { hashedPassword, salt } = await hashPassword(newPassword);

    const transaction = await this.client.transaction();
    try {
      await user.update({ hashedPassword, salt }, { transaction });
      await this._invalidateTokens(tokenRow.userId, "password_reset", transaction);
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
      await this._invalidateTokens(userId, "password_reset", transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = AuthService;
