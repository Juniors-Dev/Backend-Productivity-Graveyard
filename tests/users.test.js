const request = require("supertest");
const app = require("../app");
const { generateToken } = require("../utilities/jwt");
const { db } = require("../models");
const { registerSchema, loginSchema } = require("../schema");
const { hashPassword } = require("../utilities/hashing.js");

const rn = (n2) => {
  const n1 = Math.floor(Math.random() * 10);
  return n1 * n2;
};

const createTestUser = (suffix = "") => ({
  firstName: "Test",
  lastName: `User${suffix}`,
  username: `testuser${suffix}`,
  email: `testuser${suffix}@example.com`,
  hashedPassword: "testhash",
  salt: "testsalt",
});

const createAdminUser = () => ({
  firstName: "Admin",
  lastName: "User",
  username: "adminuser",
  email: "admin@example.com",
  hashedPassword: "adminhash",
  salt: "adminsalt",
});

const validUpdateData = {
  firstName: "Updated",
  lastName: "Name",
  username: "updateduser",
  bio: "Updated bio",
  avatarUrl: "https://example.com/avatar.jpg",
};

describe("Users API - Complete Test Suite", () => {
  let userToken, adminToken, user, admin, userRole, adminRole;

  beforeAll(async () => {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ force: false });

    userRole = await db.Role.findOne({ where: { name: "user" } });
    adminRole = await db.Role.findOne({ where: { name: "admin" } });
    const userBody = createTestUser(1);
    //const userPassword = userBody.hashedPassword;
    // const userHashing = await hashPassword(userBody.hashedPassword);
    // userBody.hashedPassword = userHashing.hashedPassword;
    // userBody.salt = userHashing.salt;
    const adminBody = createAdminUser();
    //const adminPassword = adminBody.hashedPassword;
    // const adminHashing = await hashPassword(adminBody.hashedPassword);
    // adminBody.hashedPassword = adminHashing.hashedPassword;
    // adminBody.salt = adminHashing.salt;
    user = await db.User.create({ ...userBody, roleId: userRole.id });
    admin = await db.User.create({ ...adminBody, roleId: adminRole.id });

    userToken = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
    });

    adminToken = generateToken({
      id: admin.id,
      email: admin.email,
      username: admin.username,
      roleId: admin.roleId,
    });
  });

  afterAll(async () => {
    await db.User.destroy({ where: { id: [user.id, admin.id] }, force: true });
    await db.sequelize.close();
  });

  // SCHEMA VALIDATION TESTS
  describe("Schema Validation Tests", () => {
    const email = `john${Date.now()}@example.com`;
    const username = `johnuser${rn(13)}`;
    const password = "StrongPassword123";

    describe("Register Schema Validation", () => {
      it("should validate correct registration data", async () => {
        const validData = {
          firstName: "John",
          lastName: "Doe",
          username,
          email,
          password,
        };
        await expect(registerSchema.validate(validData)).resolves.toBeTruthy();
      });

      it("should reject missing firstName", async () => {
        const invalidData = {
          lastName: "Doe",
          username,
          email,
          password,
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("First name is required");
      });

      it("should reject missing lastName", async () => {
        const invalidData = {
          firstName: "John",
          username,
          email,
          password,
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("Last name is required");
      });

      it("should reject missing username", async () => {
        const invalidData = {
          firstName: "John",
          lastName: "Doe",
          email,
          password,
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("Username is required");
      });

      it("should reject invalid email format", async () => {
        const invalidData = {
          firstName: "John",
          lastName: "Doe",
          username,
          email: "invalid-email",
          password,
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("Please provide a valid email");
      });

      it("should reject weak password", async () => {
        const invalidData = {
          firstName: "John",
          lastName: "Doe",
          username,
          email,
          password: "weak",
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("Password must be at least 8 characters");
      });

      it("should reject password without uppercase", async () => {
        const invalidData = {
          firstName: "John",
          lastName: "Doe",
          username,
          email,
          password: "lowercase123",
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow(
          "Password must contain at least one uppercase letter"
        );
      });

      it("should reject password without number", async () => {
        const invalidData = {
          firstName: "John",
          lastName: "Doe",
          username,
          email,
          password: "NoNumbersHere",
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("Password must contain at least one number");
      });

      it("should reject too long lastName", async () => {
        const invalidData = {
          firstName: "John",
          lastName: "DoeVeryLongLastNameThatExceedsLimit",
          username,
          email,
          password,
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("Last name must be at most 30 characters");
      });

      it("should reject too long username", async () => {
        const invalidData = {
          firstName: "John",
          lastName: "Doe",
          username: "thisusernameiswaytoolongtobevalid",
          email,
          password,
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("Username must be at most 30 characters");
      });

      it("should reject firstName too short", async () => {
        const invalidData = { firstName: "J", lastName: "Doe", username, email, password };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("First name must be at least 2 characters");
      });

      it("should reject too long password", async () => {
        const invalidData = {
          firstName: "John",
          lastName: "Doe",
          username,
          email,
          password: "ThisIsAVeryLongPasswordThatExceedsTheSixtyFourCharacterLimitABC123",
        };
        await expect(registerSchema.validate(invalidData)).rejects.toThrow("Password must be at most 64 characters");
      });
    });

    describe("Login Schema Validation", () => {
      it("should validate correct login data", async () => {
        const validData = {
          email,
          password,
        };
        await expect(loginSchema.validate(validData)).resolves.toBeTruthy();
      });

      it("should reject missing email", async () => {
        const invalidData = {
          password,
        };
        await expect(loginSchema.validate(invalidData)).rejects.toThrow("Email is required");
      });

      it("should reject invalid email format in login", async () => {
        const invalidData = {
          email: "invalid-email",
          password,
        };
        await expect(loginSchema.validate(invalidData)).rejects.toThrow("Please provide a valid email");
      });

      it("should reject missing password", async () => {
        const invalidData = {
          email,
        };
        await expect(loginSchema.validate(invalidData)).rejects.toThrow("Please provide a valid password");
      });
    });
  });

  // AUTHENTICATION ROUTES TESTS
  describe("Authentication Routes", () => {
    let testEmail, testUsername, testPassword;

    beforeEach(async () => {
      testEmail = `john${Date.now()}@example.com`;
      testUsername = `johnuser${Math.floor(Math.random() * 10000)}`;
      testPassword = "StrongPassword123";
    });

    describe("POST /auth/register", () => {
      it("should register a new user successfully", async () => {
        const res = await request(app)
          .post("/auth/register")
          .send({
            firstName: "John",
            lastName: "Doe",
            username: testUsername,
            email: testEmail,
            password: testPassword,
          })
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Account created successfully.");
      });

      it("should fail registration with missing required fields", async () => {
        const res = await request(app)
          .post("/auth/register")
          .send({
            firstName: "John",
            // Missing lastName
            username: testUsername,
            email: testEmail,
            password: testPassword,
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.status).toBe("bad request");
        expect(res.body.errors).toBeDefined();
        expect(res.body.errors.length).toBeGreaterThan(0);
        expect(res.body.errors.some((err) => err.message.includes("Last name is required"))).toBe(true);
      });

      it("should fail registration with invalid email format", async () => {
        const res = await request(app)
          .post("/auth/register")
          .send({
            firstName: "John",
            lastName: "Doe",
            username: testUsername,
            email: "invalid-email",
            password: testPassword,
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.status).toBe("bad request");
        expect(res.body.errors).toBeDefined();
        expect(res.body.errors.length).toBeGreaterThan(0);
        expect(res.body.errors.some((err) => err.message.includes("Please provide a valid email"))).toBe(true);
      });

      it("should fail registration with weak password", async () => {
        const res = await request(app)
          .post("/auth/register")
          .send({
            firstName: "John",
            lastName: "Doe",
            username: testUsername,
            email: testEmail,
            password: "weak",
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.status).toBe("bad request");
        expect(res.body.errors).toBeDefined();
        expect(res.body.errors.some((err) => err.message.includes("Password must be at least 8 characters"))).toBe(
          true
        );
      });
    });

    describe("POST /auth/login", () => {
      beforeEach(async () => {
        await request(app)
          .post("/auth/register")
          .send({
            firstName: "John",
            lastName: "Doe",
            username: testUsername,
            email: testEmail,
            password: testPassword,
          })
          .expect(201);
      });

      it("should login with correct credentials", async () => {
        const res = await request(app)
          .post("/auth/login")
          .send({ email: testEmail, password: testPassword })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.role).toBe("user");
      });

      it("should fail login with wrong password", async () => {
        const res = await request(app)
          .post("/auth/login")
          .send({ email: testEmail, password: "WrongPassword123" })
          .expect(401);

        expect(res.body.success).toBe(false);
        expect(res.body.status).toBe("unauthorized");
      });

      it("should fail login with missing fields", async () => {
        const res = await request(app).post("/auth/login").send({ email: testEmail }).expect(400);

        expect(res.body.success).toBe(false);
        expect(["fail", "bad request"]).toContain(res.body.status);
      });
    });
  });

  // USER ROUTES TESTS
  describe("User Routes", () => {
    describe("GET /users/me", () => {
      it("should retrieve current user successfully", async () => {
        const res = await request(app).get("/users/me").set("Authorization", `Bearer ${userToken}`).expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(user.id);
        expect(res.body.data.username).toBeDefined();
        expect(res.body.data.role).toBe("user");
        expect(res.body.data.isEmailVerified).toBe(false);
      });

      it("should return owner-specific fields for current user", async () => {
        const res = await request(app).get("/users/me").set("Authorization", `Bearer ${userToken}`).expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(user.id);
        console.warn(res.body.data);
        // Owner-specific fields that sanitizeUser should include
        //TODO expand user output if own profile
        //expect(res.body.data.email).toBeDefined();
        expect(res.body.data.fullName).toBeDefined();

        // Should NOT include sensitive fields
        expect(res.body.data.hashedPassword).toBeUndefined();
        expect(res.body.data.salt).toBeUndefined();
      });

      it("should reject request without authentication", async () => {
        const res = await request(app).get("/users/me").expect(401);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Unauthorized, token not found.");
      });

      it("should reject request with invalid token", async () => {
        const res = await request(app).get("/users/me").set("Authorization", "Bearer invalid.token").expect(401);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Unauthorized, invalid or expired token.");
      });
    });

    describe("GET /users/:id", () => {
      it("should retrieve user by ID successfully", async () => {
        const res = await request(app).get(`/users/${user.id}`).expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(user.id);
        expect(res.body.data.username).toBeDefined();
        expect(res.body.data.role).toBe("user");
      });

      it("should NOT return owner-specific fields for other users", async () => {
        const res = await request(app)
          .get(`/users/${user.id}`) // Public profile endpoint
          .expect(200);

        expect(res.body.data.username).toBeDefined();
        expect(res.body.data.bio).toBeDefined();

        // Should NOT include owner-specific fields
        expect(res.body.data.email).toBeUndefined();
        expect(res.body.data.firstName).toBeUndefined();
        expect(res.body.data.lastName).toBeUndefined();
      });

      it("should return 404 for non-existent user", async () => {
        const fakeUserId = "99999999-9999-9999-9999-999999999999";
        const res = await request(app).get(`/users/${fakeUserId}`).expect(404);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User not found");
      });

      it("should handle invalid user ID format", async () => {
        const res = await request(app).get("/users/invalid-uuid");

        expect([400, 500]).toContain(res.statusCode);
        expect(res.body.success).toBe(false);
      });
    });

    describe("PUT /users/me", () => {
      it("should update user profile successfully with valid data", async () => {
        const res = await request(app)
          .put("/users/me")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            firstName: "Updated",
            bio: "New bio",
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User profile updated successfully.");
        expect(res.body.data.username).toBeDefined();
        expect(res.body.data.role).toBe("user");
      });

      it("should update user profile with all valid fields", async () => {
        const res = await request(app)
          .put("/users/me")
          .set("Authorization", `Bearer ${userToken}`)
          .send(validUpdateData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User profile updated successfully.");
        expect(res.body.data.username).toBe(validUpdateData.username);
        expect(res.body.data.role).toBe("user");
        expect(res.body.data.id).toBeDefined();

        if (validUpdateData.bio) {
          expect(res.body.data.bio).toBe(validUpdateData.bio);
        }
        if (validUpdateData.avatarUrl) {
          expect(res.body.data.avatarUrl).toBe(validUpdateData.avatarUrl);
        }
      });

      it("should reject empty request body", async () => {
        const res = await request(app)
          .put("/users/me")
          .set("Authorization", `Bearer ${userToken}`)
          .send({})
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("At least one field must be provided for update");
      });

      it("should reject request without authentication", async () => {
        const res = await request(app).put("/users/me").send(validUpdateData).expect(401);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Unauthorized, token not found.");
      });

      it("should reject firstName too short", async () => {
        const res = await request(app)
          .put("/users/me")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ firstName: "A" })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("Validation Error");
        expect(res.body.errors.some((err) => err.message.includes("First name must be at least 2 characters"))).toBe(
          true
        );
      });

      it("should reject username with invalid characters", async () => {
        const res = await request(app)
          .put("/users/me")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ username: "user@name!" })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("Validation Error");
        expect(
          res.body.errors.some((err) =>
            err.message.includes("Username can only contain letters, numbers, and underscores")
          )
        ).toBe(true);
      });

      it("should reject bio too long", async () => {
        const res = await request(app)
          .put("/users/me")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ bio: "A".repeat(501) })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("Validation Error");
        expect(res.body.errors.some((err) => err.message.includes("Bio must be at most 500 characters"))).toBe(true);
      });

      it("should reject invalid avatarUrl", async () => {
        const res = await request(app)
          .put("/users/me")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ avatarUrl: "not-a-url" })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("Validation Error");
        expect(res.body.errors.some((err) => err.message.includes("Must be a valid URL"))).toBe(true);
      });

      it("should handle unknown fields gracefully", async () => {
        const res = await request(app).put("/users/me").set("Authorization", `Bearer ${userToken}`).send({
          firstName: "Valid",
          unknownField: "should not be allowed",
        });

        expect([400, 200]).toContain(res.statusCode);
        if (res.statusCode === 400) {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toContain("Validation Error");
        }
      });
    });

    describe("DELETE /users/me", () => {
      let userToDelete, tokenToDelete;

      beforeEach(async () => {
        const uniqueId = `55555555-5555-5555-5555-${Date.now().toString().slice(-12)}`;
        const testUser = await db.User.create({
          ...createTestUser("_delete"),
          id: uniqueId,
          username: `delete_user_${Date.now()}`,
          email: `delete_${Date.now()}@example.com`,
          roleId: userRole.id,
        });

        userToDelete = testUser;
        tokenToDelete = generateToken({
          id: testUser.id,
          email: testUser.email,
          username: testUser.username,
          roleId: testUser.roleId,
        });
      });

      afterEach(async () => {
        if (userToDelete) {
          await db.User.destroy({ where: { id: userToDelete.id }, force: true });
        }
      });

      it("should soft delete user successfully", async () => {
        const res = await request(app).delete("/users/me").set("Authorization", `Bearer ${tokenToDelete}`).expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User successfully deleted.");
      });

      it("should reject request without authentication", async () => {
        const res = await request(app).delete("/users/me").expect(401);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Unauthorized, token not found.");
      });

      it("should reject request with invalid token", async () => {
        const res = await request(app).delete("/users/me").set("Authorization", "Bearer invalid.token").expect(401);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Unauthorized, invalid or expired token.");
      });
    });
  });
});
