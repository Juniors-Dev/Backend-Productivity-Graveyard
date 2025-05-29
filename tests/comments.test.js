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
  let token1, token2, user1, user2, projectId, commentId1, commentId2;

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

    const comment1 = await postComment(projectId, token1, { message: "User1's comment" });
    const comment2 = await postComment(projectId, token2, { message: "User2's comment" });
    commentId1 = comment1.body.data.id;
    commentId2 = comment2.body.data.id;
  });

  afterAll(async () => {
    await db.Comment.destroy({ where: { projectId }, force: true });
    await db.Project.destroy({ where: { id: projectId }, force: true });
    await db.User.destroy({ where: { id: [user1.id, user2.id] }, force: true });
    await db.sequelize.close();
  });

  describe("POST /projects/:projectId/comments", () => {
    it("creates a comment successfully", async () => {
      const res = await postComment(projectId, token1, { message: messages.valid });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.message).toBe(messages.valid);
      expect(res.body.success).toBe(true);
    });

    it("creates a reply to a comment", async () => {
      const parent = await postComment(projectId, token1, { message: "Parent" });
      const reply = await postComment(projectId, token2, { message: messages.reply, parentId: parent.body.data.id });
      expect(reply.statusCode).toBe(201);
      expect(reply.body.data.parentId).toBe(parent.body.data.id);
    });

    // Authentication
    it("rejects request without authorization header", async () => {
      const res = await request(app).post(`/projects/${projectId}/comments`).send({ message: messages.valid });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized, token not found.");
    });

    it("rejects request with invalid token format", async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/comments`)
        .set("Authorization", "InvalidToken")
        .send({ message: messages.valid });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized, invalid token format.");
    });

    it("rejects request with malformed Bearer token", async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/comments`)
        .set("Authorization", "Bearer")
        .send({ message: messages.valid });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized, invalid token format.");
    });

    it("rejects request with expired/invalid token", async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/comments`)
        .set("Authorization", "Bearer invalid.jwt.token")
        .send({ message: messages.valid });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized, invalid or expired token.");
    });

    // Parameter validation
    it("rejects invalid projectId format", async () => {
      const res = await request(app)
        .post("/projects/invalid-uuid/comments")
        .set("Authorization", `Bearer ${token1}`)
        .send({ message: messages.valid });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Validation Error");
    });

    it("rejects non-existent projectId (valid UUID format)", async () => {
      const fakeProjectId = "12345678-1234-1234-1234-123456789012";
      const res = await request(app)
        .post(`/projects/${fakeProjectId}/comments`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ message: messages.valid });

      expect([400, 404, 500]).toContain(res.statusCode);
      expect(res.body.success).toBe(false);
    });

    // Body validation
    it("rejects empty message", async () => {
      const res = await postComment(projectId, token1, { message: "" });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Validation Error");

      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toContain("Comment is required");
      expect(res.body.errors).toContain("Comment cannot be empty");
      expect(res.body.errors).toHaveLength(2);
    });

    it("rejects missing message field", async () => {
      const res = await postComment(projectId, token1, {});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Comment is required");
    });

    it("rejects message that's too long", async () => {
      const res = await postComment(projectId, token1, { message: messages.tooLong });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Comment is too long (maximum 2000 characters)");
    });

    it("rejects invalid parentId format", async () => {
      const res = await postComment(projectId, token1, {
        message: messages.valid,
        parentId: "not-a-number",
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("rejects non-existent parentId", async () => {
      const fakeParentId = 99999;
      const res = await postComment(projectId, token1, {
        message: messages.valid,
        parentId: fakeParentId,
      });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Parent comment not found");
    });

    // Business Logic
    it("prevents replying to a reply (nested replies)", async () => {
      const parent = await postComment(projectId, token1, { message: "Parent" });
      const reply = await postComment(projectId, token2, { message: "Reply", parentId: parent.body.data.id });
      const nested = await postComment(projectId, token1, { message: "Nested", parentId: reply.body.data.id });

      expect(nested.statusCode).toBe(400);
      expect(nested.body.success).toBe(false);
      expect(nested.body.message).toContain("Cannot reply to a reply");
    });
  });

  describe("GET /projects/:projectId/comments", () => {
    it("retrieves project comments successfully", async () => {
      const res = await request(app).get(`/projects/${projectId}/comments`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it("handles pagination parameters", async () => {
      const res = await request(app).get(`/projects/${projectId}/comments?limit=5&offset=0`);
      expect(res.statusCode).toBe(200);
      expect(res.body.meta.limit).toBe(5);
      expect(res.body.meta.offset).toBe(0);
    });

    // Parameter Validation
    it("rejects invalid projectId format", async () => {
      const res = await request(app).get("/projects/invalid-uuid/comments");
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /comments/:id", () => {
    it("updates own comment successfully", async () => {
      const res = await request(app)
        .put(`/comments/${commentId1}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ message: messages.updated });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe(messages.updated);
    });

    // Authentication
    it("rejects request without authentication", async () => {
      const res = await request(app).put(`/comments/${commentId1}`).send({ message: messages.updated });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized, token not found.");
    });

    it("rejects request with invalid token", async () => {
      const res = await request(app)
        .put(`/comments/${commentId1}`)
        .set("Authorization", "Bearer invalid.token")
        .send({ message: messages.updated });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized, invalid or expired token.");
    });

    // Parameter validation
    it("rejects invalid comment ID format", async () => {
      const res = await request(app)
        .put("/comments/not-a-number")
        .set("Authorization", `Bearer ${token1}`)
        .send({ message: messages.updated });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // Ownership
    it("prevents updating other user's comment", async () => {
      const res = await request(app)
        .put(`/comments/${commentId1}`)
        .set("Authorization", `Bearer ${token2}`)
        .send({ message: "I'm a hacker" });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden, you do not own this entity.");
    });

    it("returns 404 for non-existent comment", async () => {
      const fakeCommentId = 99999;
      const res = await request(app)
        .put(`/comments/${fakeCommentId}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ message: messages.updated });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Not Found, entity not found.");
    });

    // Body Validation
    it("rejects empty message", async () => {
      const res = await request(app)
        .put(`/comments/${commentId1}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ message: "" });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Validation Error");

      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toContain("Comment is required");
      expect(res.body.errors).toContain("Comment cannot be empty");
      expect(res.body.errors).toHaveLength(2);
    });

    it("rejects missing message field", async () => {
      const res = await request(app).put(`/comments/${commentId1}`).set("Authorization", `Bearer ${token1}`).send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Comment is required");
    });

    it("rejects message that's too long", async () => {
      const res = await request(app)
        .put(`/comments/${commentId1}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ message: messages.tooLong });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Comment is too long (maximum 2000 characters)");
    });
  });

  describe("DELETE /comments/:id", () => {
    let commentToDelete;

    beforeEach(async () => {
      const res = await postComment(projectId, token1, { message: "To be deleted" });
      commentToDelete = res.body.data.id;
    });

    it("deletes own comment successfully", async () => {
      const res = await request(app).delete(`/comments/${commentToDelete}`).set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("deleted successfully");
    });

    // Authentication
    it("rejects request without authentication", async () => {
      const res = await request(app).delete(`/comments/${commentToDelete}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized, token not found.");
    });

    it("rejects request with invalid token", async () => {
      const res = await request(app)
        .delete(`/comments/${commentToDelete}`)
        .set("Authorization", "Bearer invalid.token");

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized, invalid or expired token.");
    });

    // Parameter validation
    it("rejects invalid comment ID format", async () => {
      const res = await request(app).delete("/comments/not-a-number").set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // Ownership
    it("prevents deleting other user's comment", async () => {
      const res = await request(app).delete(`/comments/${commentToDelete}`).set("Authorization", `Bearer ${token2}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden, you do not own this entity.");
    });

    it("returns 404 for non-existent comment", async () => {
      const fakeCommentId = 99999;
      const res = await request(app).delete(`/comments/${fakeCommentId}`).set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Not Found, entity not found.");
    });
  });
});
