const AuthService = require("../services/AuthService");
const { hashPassword } = require("../utilities/hashing");

function createMockDb() {
  const transaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
  };

  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue(transaction),
    },
    User: {
      findByPk: jest.fn(),
    },
    _transaction: transaction,
  };
}

function createMockTokenService() {
  return {
    verify: jest.fn(),
    invalidateAll: jest.fn(),
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
  let db, mockTokenService, authService;

  beforeEach(() => {
    db = createMockDb();
    mockTokenService = createMockTokenService();
    authService = new AuthService(db, mockTokenService);
  });

  describe("verifyEmail", () => {
    it("marks user as verified and invalidates tokens in a transaction", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockTokenRow();

      mockTokenService.verify.mockResolvedValue(mockToken);
      db.User.findByPk.mockResolvedValue(mockUser);

      await authService.verifyEmail("valid-plaintext");

      expect(mockTokenService.verify).toHaveBeenCalledWith("valid-plaintext", "email_verification");
      expect(mockUser.update).toHaveBeenCalledWith({ isEmailVerified: true }, { transaction: db._transaction });
      expect(mockTokenService.invalidateAll).toHaveBeenCalledWith("user-uuid-1", "email_verification", db._transaction);
      expect(db._transaction.commit).toHaveBeenCalledTimes(1);
      expect(db._transaction.rollback).not.toHaveBeenCalled();
    });

    it("throws 400 when user not found for token", async () => {
      mockTokenService.verify.mockResolvedValue(createMockTokenRow());
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

      mockTokenService.verify.mockResolvedValue(createMockTokenRow());
      db.User.findByPk.mockResolvedValue(mockUser);

      await expect(authService.verifyEmail("valid-plaintext")).rejects.toThrow("DB write failed");

      expect(db._transaction.rollback).toHaveBeenCalledTimes(1);
      expect(db._transaction.commit).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("hashes new password and updates user in a transaction", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockTokenRow({ type: "password_reset" });

      mockTokenService.verify.mockResolvedValue(mockToken);
      db.User.findByPk.mockResolvedValue(mockUser);

      await authService.resetPassword("valid-plaintext", "NewPassword123!");

      expect(mockTokenService.verify).toHaveBeenCalledWith("valid-plaintext", "password_reset");

      const updateCall = mockUser.update.mock.calls[0];
      expect(updateCall[0]).toHaveProperty("hashedPassword");
      expect(updateCall[0]).toHaveProperty("salt");
      expect(updateCall[0].hashedPassword).not.toBe("NewPassword123!");
      expect(updateCall[1].transaction).toBe(db._transaction);

      expect(mockTokenService.invalidateAll).toHaveBeenCalledWith("user-uuid-1", "password_reset", db._transaction);
      expect(db._transaction.commit).toHaveBeenCalledTimes(1);
    });

    it("throws 400 when user not found for token", async () => {
      mockTokenService.verify.mockResolvedValue(createMockTokenRow({ type: "password_reset" }));
      db.User.findByPk.mockResolvedValue(null);

      await expect(authService.resetPassword("valid-plaintext", "NewPass123!")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("rolls back transaction on failure", async () => {
      const mockUser = createMockUser();
      mockUser.update.mockRejectedValue(new Error("DB write failed"));

      mockTokenService.verify.mockResolvedValue(createMockTokenRow({ type: "password_reset" }));
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

      expect(mockTokenService.invalidateAll).toHaveBeenCalledWith("user-uuid-1", "password_reset", db._transaction);
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
