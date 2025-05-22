const request = require("supertest");
const app = require("../app");
const { generateToken } = require("../utilities/jwt");
const { db } = require("../models");

// Mock user and project data for tests
const testUser = {
  id: "11111111-1111-1111-1111-111111111111",
  firstName: "Test",
  lastName: "User",
  username: "testuser",
  email: "testuser@example.com",
  hashedPassword: "testhash",
  salt: "testsalt",
};
const testProject = {
  name: "Productivity Graveyard",
  description: "A humorous app to memorialize abandoned dev projects.",
  causeOfDeath: "Dog Puked on the server",
  status: "archived",
  startDate: "2024-10-01",
  endDate: "2025-01-15",
  eulogy: "Laid to rest after haunting VS Code for too long. Survived by hundreds of unused TODOs.",
  types: [2, 3],
};

let token;
let projectId;

describe("Projects API", () => {
  beforeAll(async () => {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ force: false });
    // Create user in DB and get the id from creation
    roleId = await db.Role.findOne({ where: { name: "user" } });
    testUser.roleId = roleId.id;
    const user = await db.User.create(testUser);

    token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
    });
  });

  afterAll(async () => {
    // Clean up: delete all projects and user
    await db.Project.destroy({ where: { userId: testUser.id }, force: true });
    await db.User.destroy({ where: { id: testUser.id }, force: true });
  });

  it("should create a new project", async () => {
    const user = await db.User.findOne({ where: { id: testUser.id } });
    console.log(user);
    const res = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...testProject });
    console.log(res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    projectId = res.body.data.id;
  });

  it("should get a project by id", async () => {
    const res = await request(app).get(`/projects/${projectId}`).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id", projectId);
  });

  it("should return 404 for non-existent project", async () => {
    const res = await request(app)
      .get("/projects/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should not create a project without auth", async () => {
    const res = await request(app)
      .post("/projects")
      .send({ ...testProject });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should validate project creation (missing name)", async () => {
    const res = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...testProject, name: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should fail validation for missing required fields", async () => {
    const res = await request(app).post("/projects").set("Authorization", `Bearer ${token}`).send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty("message");
  });

  it("should fail with missing token on update", async () => {
    const res = await request(app).put(`/projects/${projectId}`).send({ name: "Updated Name" });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should update a project", async () => {
    const res = await request(app)
      .put(`/projects/${projectId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Updated Name");
  });

  it("should add a type to the project", async () => {
    const res = await request(app)
      .put(`/projects/${projectId}/type`)
      .set("Authorization", `Bearer ${token}`)
      .send({ typeId: 2 });
    expect([200, 409]).toContain(res.statusCode); // 409 if already exists
    expect(res.body).toHaveProperty("success");
  });

  it("should remove a type from the project", async () => {
    const res = await request(app)
      .delete(`/projects/${projectId}/type`)
      .set("Authorization", `Bearer ${token}`)
      .send({ typeId: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should delete the project", async () => {
    const res = await request(app).delete(`/projects/${projectId}`).set("Authorization", `Bearer ${token}`);
    expect([200, 204]).toContain(res.statusCode);
  });
});
