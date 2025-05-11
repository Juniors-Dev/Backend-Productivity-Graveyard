const request = require("supertest");
const app = require("../app");
const { db } = require("../models");
const { registerSchema, loginSchema } = require("../schema");

//Added this function since the date variable would give an longer name than max.
let rn = (n2) => {
  const n1 = Math.floor(Math.random() * 10);
  return n1 * n2;
};

let email = `john${Date.now()}@example.com`;
let username = `johnuser${rn(13)}`;
let password = "StrongPassword123";

beforeAll(async () => {
  await db.sequelize.authenticate();
  await db.sequelize.sync({ force: false });
  await db.User.destroy({ where: { email } });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe("Schema Validation Tests", () => {
  describe("Register Schema Validation", () => {
    test("should validate correct registration data", async () => {
      const validData = {
        firstName: "John",
        lastName: "Doe",
        username,
        email,
        password,
      };
      await expect(registerSchema.validate(validData)).resolves.toBeTruthy();
    });

    test("should reject missing firstName", async () => {
      const invalidData = {
        lastName: "Doe",
        username,
        email,
        password,
      };
      await expect(registerSchema.validate(invalidData)).rejects.toThrow("First name is required");
    });

    test("should reject missing lastName", async () => {
      const invalidData = {
        firstName: "John",
        username,
        email,
        password,
      };
      await expect(registerSchema.validate(invalidData)).rejects.toThrow("Last name is required");
    });

    test("should reject missing username", async () => {
      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        email,
        password,
      };
      await expect(registerSchema.validate(invalidData)).rejects.toThrow("Username is required");
    });

    test("should reject invalid email format", async () => {
      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        username,
        email: "invalid-email",
        password,
      };
      await expect(registerSchema.validate(invalidData)).rejects.toThrow("Please provide a valid email");
    });

    test("should reject weak password", async () => {
      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        username,
        email,
        password: "weak",
      };
      await expect(registerSchema.validate(invalidData)).rejects.toThrow("Password must be at least 8 characters");
    });

    test("should reject password without uppercase", async () => {
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

    test("should reject password without number", async () => {
      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        username,
        email,
        password: "NoNumbersHere",
      };
      await expect(registerSchema.validate(invalidData)).rejects.toThrow("Password must contain at least one number");
    });
  });

  describe("Length schema validation", () => {
    test("should reject too long lastName of over 15 characters", async () => {
      const invalidData = {
        lastName: `DoeVeryLongname${Date.now()}`,
        username,
        email,
        password,
      };
      await expect(registerSchema.validate(invalidData)).rejects.toThrow("Last name must be at most 15 characters");
    });

    test("should reject too long Username of over 15 characters", async () => {
      const invalidData = {
        lastName: "Doe",
        username: `johnuser${Date.now()}`,
        email,
        password,
      };
      await expect(registerSchema.validate(invalidData)).rejects.toThrow("Username must be at most 15 characters");
    });

    test("should reject too long password of over 20 characters", async () => {
      const invalidData = {
        lastName: "Doe",
        username,
        email,
        password: `ThisisaveryLongPassword13!`,
      };
      await expect(registerSchema.validate(invalidData)).rejects.toThrow("Password must be at most 20 characters");
    });
  });

  describe("Login Schema Validation", () => {
    test("should validate correct login data", async () => {
      const validData = {
        email,
        password,
      };
      await expect(loginSchema.validate(validData)).resolves.toBeTruthy();
    });

    test("should reject missing email", async () => {
      const invalidData = {
        password,
      };
      await expect(loginSchema.validate(invalidData)).rejects.toThrow("Email is required");
    });

    test("should reject invalid email format", async () => {
      const invalidData = {
        email: "invalid-email",
        password,
      };
      await expect(loginSchema.validate(invalidData)).rejects.toThrow("Please provide a valid email");
    });

    test("should reject missing password", async () => {
      const invalidData = {
        email,
      };
      await expect(loginSchema.validate(invalidData)).rejects.toThrow("Please provide a valid password");
    });
  });
});

describe("Auth Routes Tests", () => {
  //Had to add this in order for the tests to use the same email,passoword and username.
  let email, username, password;

  beforeEach(async () => {
    email = `john${Date.now()}@example.com`;
    username = `johnuser${Math.floor(Math.random() * 10000)}`;
    password = "StrongPassword123";

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        username,
        email,
        password,
      })
      .expect(201);
  });

  test("Login with correct credentials", async () => {
    const res = await request(app).post("/auth/login").send({ email, password }).expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data.token).toBeDefined();
  });

  test("2. Login with correct credentials", async () => {
    const res = await request(app).post("/auth/login").send({ email, password }).expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data.token).toBeDefined();
  });

  test("3. Fail login with wrong password", async () => {
    const res = await request(app).post("/auth/login").send({ email, password: "WrongPassword123" }).expect(401);

    expect(res.body.status).toBe("unauthorized");
  });

  test("4. Fail login with missing fields", async () => {
    const res = await request(app).post("/auth/login").send({ email }).expect(400);

    expect(res.statusCode).toBe(400);
    expect(["fail", "bad request"]).toContain(res.body.status);
  });

  test("5. Fail registration with missing required fields", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstName: "John",
        // Missing lastName
        username,
        email,
        password,
      })
      .expect(400);

    expect(res.body.status).toBe("bad request");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.errors).toBeDefined();
    expect(res.body.data.errors.length).toBeGreaterThan(0);
    expect(res.body.data.errors[0]).toContain("Last name is required");
  });

  test("6. Fail registration with invalid email format", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        username,
        email: "invalid-email",
        password,
      })
      .expect(400);

    expect(res.body.status).toBe("bad request");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.errors).toBeDefined();
    expect(res.body.data.errors.length).toBeGreaterThan(0);
    expect(res.body.data.errors[0]).toContain("Please provide a valid email");
  });

  test("7. Fail registration with weak password", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        username,
        email,
        password: "weak",
      })
      .expect(400);

    expect(res.body.status).toBe("bad request");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.errors).toBeDefined();
    expect(res.body.data.errors[0]).toContain("Password must be at least 8 characters");
  });
});
