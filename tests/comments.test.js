const request = require("supertest");
const app = require("../app");
const { generateToken } = require("../utilities/jwt");
const { db } = require("../models");

// Test data
const createTestUser = (suffix = "") => ({
  id: `22222222-2222-2222-2222-22222222222${suffix || "2"}`,
  firstName: "Comment",
  lastName: `Tester${suffix}`,
  username: `commenttester${suffix}`,
  email: `commenttester${suffix}@example.com`,
  hashedPassword: "testhash",
  salt: "testsalt",
});

const createTestProject = (userId) => ({
  name: "Test Project for Comments",
  description: "A project for testing projects (im scared)",
  causeOfDeath: "Excessive testing",
  status: "archived",
  startDate: "2024-12-01",
  endDate: "2025-01-15",
  eulogy: "Lost to testing",
  userId,
});

const messages = {
  valid: "This is a test comment",
  reply: "This is a reply",
  updated: "Updated comment",
  minimal: "A",
  max: "B".repeat(2000),
  tooLong: "C".repeat(2001),
};

const postComment = (projectId, token, body) =>
  request(app).post(`/projects/${projectId}/comments`).set("Authorization", `Bearer ${token}`).send(body);

describe("Comments API", () => {
  let token1, token2, user1, user2, projectId;

  beforeAll(async () => {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ force: false });

    const role = await db.Role.findOne({ where: { name: "user" } });
    user1 = await db.User.create({ ...createTestUser("1"), roleId: role.id });
    user2 = await db.User.create({ ...createTestUser("2"), roleId: role.id });

    token1 = generateToken({ id: user1.id, email: user1.email, username: user1.username, roleId: user1.roleId });
    token2 = generateToken({ id: user2.id, email: user2.email, username: user2.username, roleId: user2.roleId });

    const project = await db.Project.create(createTestProject(user1.id));
    projectId = project.id;
  });

  afterAll(async () => {
    await db.Comment.destroy({ where: { projectId }, force: true });
    await db.Project.destroy({ where: { id: projectId }, force: true });
    await db.User.destroy({ where: { id: [user1.id, user2.id] }, force: true });
    await db.sequelize.close();
  });

  it("creates a comment", async () => {
    const res = await postComment(projectId, token1, { message: messages.valid });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.message).toBe(messages.valid);
  });

  it("creates a reply to a comment", async () => {
    const parent = await postComment(projectId, token1, { message: "Parent" });
    const reply = await postComment(projectId, token2, { message: messages.reply, parentId: parent.body.data.id });
    expect(reply.statusCode).toBe(201);
    expect(reply.body.data.parentId).toBe(parent.body.data.id);
  });

  it("prevents replying to a reply", async () => {
    const parent = await postComment(projectId, token1, { message: "Parent" });
    const reply = await postComment(projectId, token2, { message: "Reply", parentId: parent.body.data.id });
    const nested = await postComment(projectId, token1, { message: "Nested", parentId: reply.body.data.id });
    expect(nested.statusCode).toBe(400);
  });

  it("rejects too long comment", async () => {
    const res = await postComment(projectId, token1, { message: messages.tooLong });
    expect(res.statusCode).toBe(400);
  });

  it("rejects unauthenticated comment", async () => {
    const res = await request(app).post(`/projects/${projectId}/comments`).send({ message: messages.valid });
    expect(res.statusCode).toBe(401);
  });

  it("retrieves project comments", async () => {
    const res = await request(app).get(`/projects/${projectId}/comments`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("updates own comment", async () => {
    const created = await postComment(projectId, token1, { message: "To update" });
    const res = await request(app)
      .put(`/comments/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ message: messages.updated });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.message).toBe(messages.updated);
  });

  it("prevents updating other user's comment", async () => {
    const created = await postComment(projectId, token1, { message: "Original" });
    const res = await request(app)
      .put(`/comments/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({ message: "Hacked" });
    expect(res.statusCode).toBe(403);
  });

  it("deletes own comment", async () => {
    const created = await postComment(projectId, token1, { message: "To delete" });
    const res = await request(app).delete(`/comments/${created.body.data.id}`).set("Authorization", `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
  });

  it("prevents deleting other user's comment", async () => {
    const created = await postComment(projectId, token1, { message: "Original" });
    const res = await request(app).delete(`/comments/${created.body.data.id}`).set("Authorization", `Bearer ${token2}`);
    expect(res.statusCode).toBe(403);
  });
});
