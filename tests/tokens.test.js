const TokenService = require("../services/TokenService");
const { hashToken } = require("../utilities/hashing");

function createMockDb() {
  return {
    Token: {
      create: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue([1]),
      count: jest.fn().mockResolvedValue(0),
    },
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

describe("TokenService", () => {
  let db, tokenService;

  beforeEach(() => {
    db = createMockDb();
    tokenService = new TokenService(db);
  });

  describe("create", () => {
    it("stores a hashed token in the database", async () => {
      const { plaintext } = await tokenService.create("user-uuid-1", "email_verification");

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
      await tokenService.create("user-uuid-1", "email_verification");
      const after = Date.now();

      const expiresAt = db.Token.create.mock.calls[0][0].expiresAt.getTime();
      const expectedMs = 24 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(before + expectedMs);
      expect(expiresAt).toBeLessThanOrEqual(after + expectedMs);
    });

    it("sets correct expiry for password_reset (30 minutes)", async () => {
      const before = Date.now();
      await tokenService.create("user-uuid-1", "password_reset");
      const after = Date.now();

      const expiresAt = db.Token.create.mock.calls[0][0].expiresAt.getTime();
      const expectedMs = 30 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(before + expectedMs);
      expect(expiresAt).toBeLessThanOrEqual(after + expectedMs);
    });

    it("throws on unknown token type", async () => {
      await expect(tokenService.create("user-uuid-1", "garbage")).rejects.toThrow("Unknown token type: garbage");

      expect(db.Token.create).not.toHaveBeenCalled();
    });

    it("stores ipAddress and userAgent when provided", async () => {
      await tokenService.create("user-uuid-1", "email_verification", {
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 Test",
      });

      const createArg = db.Token.create.mock.calls[0][0];
      expect(createArg.ipAddress).toBe("192.168.1.1");
      expect(createArg.userAgent).toBe("Mozilla/5.0 Test");
    });

    it("stores null ipAddress and userAgent when opts empty", async () => {
      await tokenService.create("user-uuid-1", "email_verification");

      const createArg = db.Token.create.mock.calls[0][0];
      expect(createArg.ipAddress).toBeNull();
      expect(createArg.userAgent).toBeNull();
    });
  });

  describe("verify", () => {
    it("returns the token row when valid", async () => {
      const mockRow = createMockTokenRow();
      db.Token.findOne.mockResolvedValue(mockRow);

      const result = await tokenService.verify("some-plaintext", "email_verification");

      expect(result).toBe(mockRow);
      expect(db.Token.findOne).toHaveBeenCalledTimes(1);
    });

    it("queries with hashed token, correct type, unused, and not expired", async () => {
      db.Token.findOne.mockResolvedValue(createMockTokenRow());

      await tokenService.verify("abc123", "password_reset");

      const where = db.Token.findOne.mock.calls[0][0].where;
      expect(where.tokenHash).toBe(hashToken("abc123"));
      expect(where.type).toBe("password_reset");
      expect(where.usedAt).toBeNull();
      expect(where.expiresAt).toBeDefined();
    });

    it("throws 400 when token not found", async () => {
      db.Token.findOne.mockResolvedValue(null);

      await expect(tokenService.verify("bad-token", "email_verification")).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid or expired token.",
      });
    });
  });

  describe("invalidateAll", () => {
    it("marks all unused tokens of that type as used", async () => {
      await tokenService.invalidateAll("user-uuid-1", "email_verification");

      expect(db.Token.update).toHaveBeenCalledTimes(1);

      const [values, options] = db.Token.update.mock.calls[0];
      expect(values.usedAt).toBeInstanceOf(Date);
      expect(options.where.userId).toBe("user-uuid-1");
      expect(options.where.type).toBe("email_verification");
      expect(options.where.usedAt).toBeNull();
    });

    it("passes transaction when provided", async () => {
      const tx = { commit: jest.fn(), rollback: jest.fn() };
      await tokenService.invalidateAll("user-uuid-1", "email_verification", tx);

      const options = db.Token.update.mock.calls[0][1];
      expect(options.transaction).toBe(tx);
    });

    it("omits transaction key when not provided", async () => {
      await tokenService.invalidateAll("user-uuid-1", "email_verification");

      const options = db.Token.update.mock.calls[0][1];
      expect(options).not.toHaveProperty("transaction");
    });
  });

  describe("enforceLimits", () => {
    it("passes when no recent token and under daily limit", async () => {
      db.Token.findOne.mockResolvedValue(null);
      db.Token.count.mockResolvedValue(0);

      await expect(tokenService.enforceLimits("user-uuid-1", "email_verification")).resolves.toBeUndefined();

      expect(db.Token.findOne).toHaveBeenCalledTimes(1);
      expect(db.Token.count).toHaveBeenCalledTimes(1);
    });

    it("throws 429 with retryAfter when a recent token exists", async () => {
      const recentToken = {
        createdAt: new Date(Date.now() - 60 * 1000),
      };
      db.Token.findOne.mockResolvedValue(recentToken);

      const error = await tokenService.enforceLimits("user-uuid-1", "email_verification").catch((e) => e);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe("Please wait before requesting another email.");
      expect(error.retryAfter).toBeGreaterThan(0);
      expect(error.retryAfter).toBeLessThanOrEqual(5 * 60);
    });

    it("calculates retryAfter as remaining cooldown seconds", async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      db.Token.findOne.mockResolvedValue({ createdAt: twoMinutesAgo });

      const error = await tokenService.enforceLimits("user-uuid-1", "email_verification").catch((e) => e);
      expect(error.retryAfter).toBeGreaterThanOrEqual(179);
      expect(error.retryAfter).toBeLessThanOrEqual(181);
    });

    it("skips daily limit check when cooldown is hit", async () => {
      db.Token.findOne.mockResolvedValue({
        createdAt: new Date(Date.now() - 30 * 1000),
      });

      await expect(tokenService.enforceLimits("user-uuid-1", "email_verification")).rejects.toMatchObject({
        statusCode: 429,
      });

      expect(db.Token.count).not.toHaveBeenCalled();
    });

    it("throws 429 when daily limit is reached", async () => {
      db.Token.findOne.mockResolvedValue(null);
      db.Token.count.mockResolvedValue(5);

      await expect(tokenService.enforceLimits("user-uuid-1", "email_verification")).rejects.toMatchObject({
        statusCode: 429,
        message: "Daily email limit reached. Please try again later.",
      });
    });

    it("does not include retryAfter on daily limit error", async () => {
      db.Token.findOne.mockResolvedValue(null);
      db.Token.count.mockResolvedValue(5);

      const error = await tokenService.enforceLimits("user-uuid-1", "email_verification").catch((e) => e);
      expect(error.retryAfter).toBeUndefined();
    });

    it("passes at count 4 but rejects at count 5", async () => {
      db.Token.findOne.mockResolvedValue(null);
      db.Token.count.mockResolvedValue(4);
      await expect(tokenService.enforceLimits("user-uuid-1", "email_verification")).resolves.toBeUndefined();
      db.Token.count.mockResolvedValue(5);
      await expect(tokenService.enforceLimits("user-uuid-1", "email_verification")).rejects.toMatchObject({
        statusCode: 429,
      });
    });
  });

  describe("createVerificationToken", () => {
    it("invalidates existing tokens then creates a new one", async () => {
      const plaintext = await tokenService.createVerificationToken("user-uuid-1");

      expect(typeof plaintext).toBe("string");
      expect(plaintext.length).toBe(64);

      expect(db.Token.update).toHaveBeenCalledTimes(1);
      expect(db.Token.create).toHaveBeenCalledTimes(1);

      const updateWhere = db.Token.update.mock.calls[0][1].where;
      expect(updateWhere.type).toBe("email_verification");

      const createArg = db.Token.create.mock.calls[0][0];
      expect(createArg.type).toBe("email_verification");
    });

    it("passes opts through to create", async () => {
      await tokenService.createVerificationToken("user-uuid-1", {
        ipAddress: "10.0.0.1",
        userAgent: "TestAgent/1.0",
      });

      const createArg = db.Token.create.mock.calls[0][0];
      expect(createArg.ipAddress).toBe("10.0.0.1");
      expect(createArg.userAgent).toBe("TestAgent/1.0");
    });
  });

  describe("createPasswordResetToken", () => {
    it("invalidates existing reset tokens then creates a new one", async () => {
      const plaintext = await tokenService.createPasswordResetToken("user-uuid-1");

      expect(typeof plaintext).toBe("string");
      expect(plaintext.length).toBe(64);

      const updateWhere = db.Token.update.mock.calls[0][1].where;
      expect(updateWhere.type).toBe("password_reset");

      const createArg = db.Token.create.mock.calls[0][0];
      expect(createArg.type).toBe("password_reset");
    });

    it("passes opts through to create", async () => {
      await tokenService.createPasswordResetToken("user-uuid-1", {
        ipAddress: "10.0.0.1",
        userAgent: "TestAgent/1.0",
      });

      const createArg = db.Token.create.mock.calls[0][0];
      expect(createArg.ipAddress).toBe("10.0.0.1");
      expect(createArg.userAgent).toBe("TestAgent/1.0");
    });
  });
});
