const request = require("supertest");
const app = require("../app");
const { generateToken } = require("../utilities/jwt");
const { db } = require("../models");

const createTestUser = (suffix = "") => ({
  id: `33333333-3333-3333-3333-33333333333${suffix || "3"}`,
  firstName: "Vote",
  lastName: `Tester${suffix}`,
  username: `votetester${suffix}`,
  email: `votetester${suffix}@example.com`,
  hashedPassword: "testhash",
  salt: "testsalt",
});

const createTestProject = (userId) => ({
  name: "Vote Project",
  description: "Project for upvote testing",
  causeOfDeath: "Excessive voting",
  status: "archived",
  startDate: "2024-11-03",
  endDate: "2025-01-01",
  eulogy: "Lost to democratic processes",
  userId,
});

const toggleUpvote = (projectId, token) =>
  request(app).post(`/votes/${projectId}/toggle`).set("Authorization", `Bearer ${token}`);

describe("Votes API", () => {
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

  afterEach(async () => {
    await db.Upvote.destroy({ where: { projectId }, force: true });
  });

  afterAll(async () => {
    await db.Project.destroy({ where: { id: projectId }, force: true });
    await db.User.destroy({ where: { id: [user1.id, user2.id] }, force: true });
    await db.sequelize.close();
  });

  it("adds upvote to project", async () => {
    const res = await toggleUpvote(projectId, token1);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Project upvoted successfully");
    expect(res.body.data.upvoted).toBe(true);
    expect(res.body.data.count).toBeGreaterThan(0);
  });

  it("removes upvote from project when toggled again", async () => {
    const upvoteRes = await toggleUpvote(projectId, token1);
    const initialCount = upvoteRes.body.data.count;

    const res = await toggleUpvote(projectId, token1);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Upvote removed successfully");
    expect(res.body.data.upvoted).toBe(false);
    expect(res.body.data.count).toBe(initialCount - 1);
  });

  it("allows multiple users to upvote same project", async () => {
    const res1 = await toggleUpvote(projectId, token1);
    expect(res1.body.data.upvoted).toBe(true);
    const countAfterUser1 = res1.body.data.count;

    const res2 = await toggleUpvote(projectId, token2);
    expect(res2.body.data.upvoted).toBe(true);
    expect(res2.body.data.count).toBe(countAfterUser1 + 1);
  });

  it("removes individual upvote without affecting other users", async () => {
    await toggleUpvote(projectId, token1);
    const bothVotedRes = await toggleUpvote(projectId, token2);
    const countWithBothVotes = bothVotedRes.body.data.count;

    const res = await toggleUpvote(projectId, token1);
    expect(res.body.data.upvoted).toBe(false);
    expect(res.body.data.count).toBe(countWithBothVotes - 1);
  });

  it("rejects unauthenticated upvote request", async () => {
    const res = await request(app).post(`/votes/${projectId}/toggle`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unauthorized, token not found.");
  });

  it("rejects request with invalid token", async () => {
    const res = await request(app).post(`/votes/${projectId}/toggle`).set("Authorization", "Bearer invalid-token");

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unauthorized, invalid or expired token.");
  });

  it("rejects request with malformed authorization header", async () => {
    const res = await request(app).post(`/votes/${projectId}/toggle`).set("Authorization", "InvalidFormat");

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unauthorized, invalid token format.");
  });

  it("rejects request with invalid project ID format", async () => {
    const invalidProjectId = "invalid-uuid";
    const res = await toggleUpvote(invalidProjectId, token1);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe("bad request");
  });

  it("rejects vote request for a non-existent project", async () => {
    const nonExistentProjectId = "123e4567-e89b-12d3-a456-426614174000";
    const res = await toggleUpvote(nonExistentProjectId, token1);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe("fail");
  });

  it("handles multiple toggle operations in sequence", async () => {
    const res1 = await toggleUpvote(projectId, token1);
    expect(res1.body.data.upvoted).toBe(true);

    const res2 = await toggleUpvote(projectId, token1);
    expect(res2.body.data.upvoted).toBe(false);

    const res3 = await toggleUpvote(projectId, token1);
    expect(res3.body.data.upvoted).toBe(true);
  });
});
