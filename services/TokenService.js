const { Op } = require("sequelize");
const { generateToken, hashToken } = require("../utilities/hashing");
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

class TokenService {
  constructor(db) {
    this.Token = db.Token;
  }

  async create(userId, type, opts = {}) {
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
      ipAddress: opts.ipAddress || null,
      userAgent: opts.userAgent || null,
    });
    return { plaintext };
  }

  async verify(plaintext, type) {
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

  async invalidateAll(userId, type, transaction = null) {
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

  async enforceLimits(userId, type) {
    const cooldownMs = TOKEN_COOLDOWN_MS.get(type);
    const dailyLimit = TOKEN_DAILY_LIMIT.get(type);
    if (cooldownMs == null || dailyLimit == null) {
      throw new Error(`Unknown token type: ${type}`);
    }

    const recentToken = await this.Token.findOne({
      where: {
        userId,
        type,
        createdAt: { [Op.gt]: new Date(Date.now() - cooldownMs) },
      },
      order: [["createdAt", "DESC"]],
      attributes: ["createdAt"],
    });

    if (recentToken) {
      const elapsedMs = Date.now() - recentToken.createdAt.getTime();
      const remainingMs = cooldownMs - elapsedMs;
      const maxSeconds = Math.ceil(cooldownMs / 1000);
      const retryAfterSeconds = Math.min(Math.max(Math.ceil(remainingMs / 1000), 1), maxSeconds);

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

  async createVerificationToken(userId, opts = {}) {
    await this.enforceLimits(userId, "email_verification");
    await this.invalidateAll(userId, "email_verification");
    const { plaintext } = await this.create(userId, "email_verification", opts);
    return plaintext;
  }

  async createPasswordResetToken(userId, opts = {}) {
    await this.enforceLimits(userId, "password_reset");
    await this.invalidateAll(userId, "password_reset");
    const { plaintext } = await this.create(userId, "password_reset", opts);
    return plaintext;
  }
}

module.exports = TokenService;
