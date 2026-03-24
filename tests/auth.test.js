const AuthService = require("../services/AuthService");
const { hashPassword, hashToken } = require("../utilities/hashing");

function createMockDb() {
  const transaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
  };

  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue(transaction),
    },
    Token: {
      create: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue([1]),
      count: jest.fn().mockResolvedValue(0),
    },
    User: {
      findByPk: jest.fn(),
    },
    _transaction: transaction,
  };
}

function createMockUser(overrides = {}) {
  return {
    id: "user-uuid-1",
    hashedPassword: "stored-hash",
    salt: "stored-salt",
    isEmailVerified: false,
    update: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function createMockTokenRow(overrides = {}) {
  return {
    userId: "user-uuid-1",
    type: "email_verification",
    tokenHash: "some-hash",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
    ...overrides,
  };
}

describe("AuthService", () => {
  let db, authService;

  beforeEach(() => {
    db = createMockDb();
    authService = new AuthService(db);
  });

  describe("_createToken", () => {
    it("stores a hashed token in the database", async () => {
      const { plaintext } = await authService._createToken("user-uuid-1", "email_verification");

      expect(db.Token.create).toHaveBeenCalledTimes(1);

      const createArg = db.Token.create.mock.calls[0][0];
      expect(createArg.userId).toBe("user-uuid-1");
      expect(createArg.type).toBe("email_verification");
      expect(createArg.tokenHash).not.toBe(plaintext);
      expect(createArg.expiresAt).toBeInstanceOf(Date);
      expect(createArg.tokenHash).toBe(hashToken(plaintext));
    });

    it("sets correct expiry for email_verification (24 hours)", async () => {
      const before = Date.now();
      await authService._createToken("user-uuid-1", "email_verification");
      const after = Date.now();

      const expiresAt = db.Token.create.mock.calls[0][0].expiresAt.getTime();
      const expectedMs = 24 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(before + expectedMs);
      expect(expiresAt).toBeLessThanOrEqual(after + expectedMs);
    });

    it("sets correct expiry for password_reset (30 minutes)", async () => {
      const before = Date.now();
      await authService._createToken("user-uuid-1", "password_reset");
      const after = Date.now();

      const expiresAt = db.Token.create.mock.calls[0][0].expiresAt.getTime();
      const expectedMs = 30 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(before + expectedMs);
      expect(expiresAt).toBeLessThanOrEqual(after + expectedMs);
    });

    it("throws on unknown token type", async () => {
      await expect(authService._createToken("user-uuid-1", "garbage")).rejects.toThrow("Unknown token type: garbage");

      expect(db.Token.create).not.toHaveBeenCalled();
    });
  });

  describe("_verifyToken", () => {
    it("returns the token row when valid", async () => {
      const mockRow = createMockTokenRow();
      db.Token.findOne.mockResolvedValue(mockRow);

      const result = await authService._verifyToken("some-plaintext", "email_verification");

      expect(result).toBe(mockRow);
      expect(db.Token.findOne).toHaveBeenCalledTimes(1);
    });

    it("queries with hashed token, correct type, unused, and not expired", async () => {
      db.Token.findOne.mockResolvedValue(createMockTokenRow());

      await authService._verifyToken("abc123", "password_reset");

      const where = db.Token.findOne.mock.calls[0][0].where;
      expect(where.tokenHash).toBe(hashToken("abc123"));
      expect(where.type).toBe("password_reset");
      expect(where.usedAt).toBeNull();
      expect(where.expiresAt).toBeDefined();
    });

    it("throws 400 when token not found", async () => {
      db.Token.findOne.mockResolvedValue(null);

      await expect(authService._verifyToken("bad-token", "email_verification")).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid or expired token.",
      });
    });
  });

  describe("_invalidateTokens", () => {
    it("marks all unused tokens of that type as used", async () => {
      await authService._invalidateTokens("user-uuid-1", "email_verification");

      expect(db.Token.update).toHaveBeenCalledTimes(1);

      const [values, options] = db.Token.update.mock.calls[0];
      expect(values.usedAt).toBeInstanceOf(Date);
      expect(options.where.userId).toBe("user-uuid-1");
      expect(options.where.type).toBe("email_verification");
      expect(options.where.usedAt).toBeNull();
    });

    it("passes transaction when provided", async () => {
      const tx = { commit: jest.fn(), rollback: jest.fn() };
      await authService._invalidateTokens("user-uuid-1", "email_verification", tx);

      const options = db.Token.update.mock.calls[0][1];
      expect(options.transaction).toBe(tx);
    });

    it("omits transaction key when not provided", async () => {
      await authService._invalidateTokens("user-uuid-1", "email_verification");

      const options = db.Token.update.mock.calls[0][1];
      expect(options).not.toHaveProperty("transaction");
    });
  });

  describe("_enforceTokenLimits", () => {
    it("passes when no recent token and under daily limit", async () => {
      db.Token.findOne.mockResolvedValue(null);
      db.Token.count.mockResolvedValue(0);

      await expect(authService._enforceTokenLimits("user-uuid-1", "email_verification")).resolves.toBeUndefined();

      expect(db.Token.findOne).toHaveBeenCalledTimes(1);
      expect(db.Token.count).toHaveBeenCalledTimes(1);
    });

    it("throws 429 with retryAfter when a recent token exists", async () => {
      const recentToken = {
        createdAt: new Date(Date.now() - 60 * 1000),
      };
      db.Token.findOne.mockResolvedValue(recentToken);

      const error = await authService._enforceTokenLimits("user-uuid-1", "email_verification").catch((e) => e);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe("Please wait before requesting another email.");
      expect(error.retryAfter).toBeGreaterThan(0);
      expect(error.retryAfter).toBeLessThanOrEqual(5 * 60);
    });

    it("calculates retryAfter as remaining cooldown seconds", async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      db.Token.findOne.mockResolvedValue({ createdAt: twoMinutesAgo });

      const error = await authService._enforceTokenLimits("user-uuid-1", "email_verification").catch((e) => e);
      expect(error.retryAfter).toBeGreaterThanOrEqual(179);
      expect(error.retryAfter).toBeLessThanOrEqual(181);
    });

    it("skips daily limit check when cooldown is hit", async () => {
      db.Token.findOne.mockResolvedValue({
        createdAt: new Date(Date.now() - 30 * 1000),
      });

      await expect(authService._enforceTokenLimits("user-uuid-1", "email_verification")).rejects.toMatchObject({
        statusCode: 429,
      });

      expect(db.Token.count).not.toHaveBeenCalled();
    });

    it("throws 429 when daily limit is reached", async () => {
      db.Token.findOne.mockResolvedValue(null);
      db.Token.count.mockResolvedValue(5);

      await expect(authService._enforceTokenLimits("user-uuid-1", "email_verification")).rejects.toMatchObject({
        statusCode: 429,
        message: "Daily email limit reached. Please try again later.",
      });
    });

    it("does not include retryAfter on daily limit error", async () => {
      db.Token.findOne.mockResolvedValue(null);
      db.Token.count.mockResolvedValue(5);

      const error = await authService._enforceTokenLimits("user-uuid-1", "email_verification").catch((e) => e);
      expect(error.retryAfter).toBeUndefined();
    });

    it("passes at count 4 but rejects at count 5", async () => {
      db.Token.findOne.mockResolvedValue(null);
      db.Token.count.mockResolvedValue(4);
      await expect(authService._enforceTokenLimits("user-uuid-1", "email_verification")).resolves.toBeUndefined();
      db.Token.count.mockResolvedValue(5);
      await expect(authService._enforceTokenLimits("user-uuid-1", "email_verification")).rejects.toMatchObject({
        statusCode: 429,
      });
    });
  });

  describe("createVerificationToken", () => {
    it("invalidates existing tokens then creates a new one", async () => {
      const plaintext = await authService.createVerificationToken("user-uuid-1");

      expect(typeof plaintext).toBe("string");
      expect(plaintext.length).toBe(64);

      expect(db.Token.update).toHaveBeenCalledTimes(1);
      expect(db.Token.create).toHaveBeenCalledTimes(1);

      const updateWhere = db.Token.update.mock.calls[0][1].where;
      expect(updateWhere.type).toBe("email_verification");

      const createArg = db.Token.create.mock.calls[0][0];
      expect(createArg.type).toBe("email_verification");
    });
  });

  describe("verifyEmail", () => {
    it("marks user as verified and invalidates tokens in a transaction", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockTokenRow();

      db.Token.findOne.mockResolvedValue(mockToken);
      db.User.findByPk.mockResolvedValue(mockUser);

      await authService.verifyEmail("valid-plaintext");

      expect(mockUser.update).toHaveBeenCalledWith({ isEmailVerified: true }, { transaction: db._transaction });

      const updateOptions = db.Token.update.mock.calls[0][1];
      expect(updateOptions.transaction).toBe(db._transaction);
      expect(updateOptions.where.type).toBe("email_verification");

      expect(db._transaction.commit).toHaveBeenCalledTimes(1);
      expect(db._transaction.rollback).not.toHaveBeenCalled();
    });

    it("throws 400 when user not found for token", async () => {
      db.Token.findOne.mockResolvedValue(createMockTokenRow());
      db.User.findByPk.mockResolvedValue(null);

      await expect(authService.verifyEmail("valid-plaintext")).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid or expired token.",
      });

      expect(db._transaction.commit).not.toHaveBeenCalled();
    });

    it("rolls back transaction on failure", async () => {
      const mockUser = createMockUser();
      mockUser.update.mockRejectedValue(new Error("DB write failed"));

      db.Token.findOne.mockResolvedValue(createMockTokenRow());
      db.User.findByPk.mockResolvedValue(mockUser);

      await expect(authService.verifyEmail("valid-plaintext")).rejects.toThrow("DB write failed");

      expect(db._transaction.rollback).toHaveBeenCalledTimes(1);
      expect(db._transaction.commit).not.toHaveBeenCalled();
    });
  });

  describe("createPasswordResetToken", () => {
    it("invalidates existing reset tokens then creates a new one", async () => {
      const plaintext = await authService.createPasswordResetToken("user-uuid-1");

      expect(typeof plaintext).toBe("string");
      expect(plaintext.length).toBe(64);

      const updateWhere = db.Token.update.mock.calls[0][1].where;
      expect(updateWhere.type).toBe("password_reset");

      const createArg = db.Token.create.mock.calls[0][0];
      expect(createArg.type).toBe("password_reset");
    });
  });

  describe("resetPassword", () => {
    it("hashes new password and updates user in a transaction", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockTokenRow({ type: "password_reset" });

      db.Token.findOne.mockResolvedValue(mockToken);
      db.User.findByPk.mockResolvedValue(mockUser);

      await authService.resetPassword("valid-plaintext", "NewPassword123!");

      const updateCall = mockUser.update.mock.calls[0];
      expect(updateCall[0]).toHaveProperty("hashedPassword");
      expect(updateCall[0]).toHaveProperty("salt");
      expect(updateCall[0].hashedPassword).not.toBe("NewPassword123!");
      expect(updateCall[1].transaction).toBe(db._transaction);

      const tokenUpdateWhere = db.Token.update.mock.calls[0][1].where;
      expect(tokenUpdateWhere.type).toBe("password_reset");

      expect(db._transaction.commit).toHaveBeenCalledTimes(1);
    });

    it("throws 400 when user not found for token", async () => {
      db.Token.findOne.mockResolvedValue(createMockTokenRow({ type: "password_reset" }));
      db.User.findByPk.mockResolvedValue(null);

      await expect(authService.resetPassword("valid-plaintext", "NewPass123!")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("rolls back transaction on failure", async () => {
      const mockUser = createMockUser();
      mockUser.update.mockRejectedValue(new Error("DB write failed"));

      db.Token.findOne.mockResolvedValue(createMockTokenRow({ type: "password_reset" }));
      db.User.findByPk.mockResolvedValue(mockUser);

      await expect(authService.resetPassword("valid-plaintext", "NewPass123!")).rejects.toThrow("DB write failed");

      expect(db._transaction.rollback).toHaveBeenCalledTimes(1);
      expect(db._transaction.commit).not.toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    let realHash;

    beforeAll(async () => {
      realHash = await hashPassword("OldPassword123!");
    });

    it("updates password and invalidates reset tokens when current password is correct", async () => {
      const mockUser = createMockUser({
        hashedPassword: realHash.hashedPassword,
        salt: realHash.salt,
      });
      db.User.findByPk.mockResolvedValue(mockUser);

      await authService.changePassword("user-uuid-1", "OldPassword123!", "NewPassword456!");

      const updateCall = mockUser.update.mock.calls[0];
      expect(updateCall[0]).toHaveProperty("hashedPassword");
      expect(updateCall[0]).toHaveProperty("salt");
      expect(updateCall[0].hashedPassword).not.toBe("NewPassword456!");
      expect(updateCall[0].hashedPassword).not.toBe(realHash.hashedPassword);
      expect(updateCall[1].transaction).toBe(db._transaction);

      const tokenUpdateWhere = db.Token.update.mock.calls[0][1].where;
      expect(tokenUpdateWhere.userId).toBe("user-uuid-1");
      expect(tokenUpdateWhere.type).toBe("password_reset");

      expect(db._transaction.commit).toHaveBeenCalledTimes(1);
    });

    it("throws 401 when current password is wrong", async () => {
      const mockUser = createMockUser({
        hashedPassword: realHash.hashedPassword,
        salt: realHash.salt,
      });
      db.User.findByPk.mockResolvedValue(mockUser);

      await expect(
        authService.changePassword("user-uuid-1", "WrongPassword!", "NewPassword456!")
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Current password is incorrect.",
      });

      expect(mockUser.update).not.toHaveBeenCalled();
    });

    it("throws 404 when user not found", async () => {
      db.User.findByPk.mockResolvedValue(null);

      await expect(authService.changePassword("nonexistent-id", "OldPass123!", "NewPass456!")).rejects.toMatchObject({
        statusCode: 404,
        message: "User not found.",
      });
    });

    it("fetches only the fields needed for password verification", async () => {
      const mockUser = createMockUser({
        hashedPassword: realHash.hashedPassword,
        salt: realHash.salt,
      });
      db.User.findByPk.mockResolvedValue(mockUser);

      await authService.changePassword("user-uuid-1", "OldPassword123!", "NewPassword456!");

      const findByPkOptions = db.User.findByPk.mock.calls[0][1];
      expect(findByPkOptions.attributes).toEqual(["id", "hashedPassword", "salt"]);
    });

    it("rolls back transaction on failure", async () => {
      const mockUser = createMockUser({
        hashedPassword: realHash.hashedPassword,
        salt: realHash.salt,
      });
      mockUser.update.mockRejectedValue(new Error("DB write failed"));
      db.User.findByPk.mockResolvedValue(mockUser);

      await expect(authService.changePassword("user-uuid-1", "OldPassword123!", "NewPassword456!")).rejects.toThrow(
        "DB write failed"
      );

      expect(db._transaction.rollback).toHaveBeenCalledTimes(1);
      expect(db._transaction.commit).not.toHaveBeenCalled();
    });
  });
});
