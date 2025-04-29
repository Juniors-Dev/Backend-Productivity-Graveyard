const request = require("supertest");
const app = require("../app");
const { db } = require("../models");

let email = `john${Date.now()}@example.com`;
let username = `johnuser${Date.now()}`;
let password = "StrongPassword123";

beforeAll(async () => {
  await db.User.destroy({ where: { email } });
  await db.sequelize.authenticate();
  await db.sequelize.sync({ force: false });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe("Auth Routes Tests", () => {
  test("1. Register a new user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        username,
        email,
        password,
      })
      .expect(201);

    expect(res.body.status).toBe("success");
    expect(res.body.data.result).toBe("Account created.");
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
});
