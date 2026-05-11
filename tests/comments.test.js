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

    const role = await db.Role.findOne({ where: { name: "user" } });
    user1 = await db.User.create({ ...createTestUser("1"), roleId: role.id });
    user2 = await db.User.create({ ...createTestUser("2"), roleId: role.id });

    token1 = generateToken({ id: user1.id, email: user1.email, username: user1.username, roleId: role.name });
    token2 = generateToken({ id: user2.id, email: user2.email, username: user2.username, roleId: role.name });

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

    // NEW: Thread functionality tests
    describe("Thread functionality", () => {
      it("creates thread structure correctly for root comment", async () => {
        const res = await postComment(projectId, token1, { message: "Root comment" });
        expect(res.statusCode).toBe(201);
        expect(res.body.data.threadId).toBe(res.body.data.id);
        expect(res.body.data.parentId).toBeNull();
      });

      it("sets threadId correctly for replies", async () => {
        const parent = await postComment(projectId, token1, { message: "Parent comment" });
        const reply = await postComment(projectId, token2, {
          message: "Reply to parent",
          parentId: parent.body.data.id,
        });

        expect(reply.statusCode).toBe(201);
        expect(reply.body.data.threadId).toBe(parent.body.data.id);
        expect(reply.body.data.parentId).toBe(parent.body.data.id);
      });

      it("maintains thread consistency for multiple replies", async () => {
        const parent = await postComment(projectId, token1, { message: "Thread starter" });
        const reply1 = await postComment(projectId, token2, {
          message: "First reply",
          parentId: parent.body.data.id,
        });
        const reply2 = await postComment(projectId, token1, {
          message: "Second reply",
          parentId: parent.body.data.id,
        });

        expect(reply1.body.data.threadId).toBe(parent.body.data.id);
        expect(reply2.body.data.threadId).toBe(parent.body.data.id);
        expect(reply1.body.data.threadId).toBe(reply2.body.data.threadId);
      });
    });

    // Authentication tests
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
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "message",
            message: "Comment is required",
          }),
          expect.objectContaining({
            field: "message",
            message: "Comment cannot be empty",
          }),
        ])
      );
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
  });

  describe("GET /projects/:projectId/comments", () => {
    it("retrieves project comments successfully", async () => {
      const res = await request(app).get(`/projects/${projectId}/comments`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it("includes reply count and preview in root comments", async () => {
      const uniqueMessage = `Parent with replies ${Date.now()}`;
      const parent = await postComment(projectId, token1, { message: uniqueMessage });
      await postComment(projectId, token2, { message: "Reply 1", parentId: parent.body.data.id });
      await postComment(projectId, token1, { message: "Reply 2", parentId: parent.body.data.id });
      await postComment(projectId, token2, { message: "Reply 3", parentId: parent.body.data.id });

      const res = await request(app).get(`/projects/${projectId}/comments`);
      expect(res.statusCode).toBe(200);

      const testComment = res.body.data.find((c) => c.message === uniqueMessage);
      expect(testComment).toBeDefined();
      expect(testComment.replyCount).toBe(3);
      expect(testComment.replyPreview).toBeDefined();
      expect(Array.isArray(testComment.replyPreview)).toBe(true);
      expect(testComment.replyPreview.length).toBeLessThanOrEqual(2);
    });

    it("handles pagination parameters", async () => {
      const res = await request(app).get(`/projects/${projectId}/comments?limit=5&offset=0`);
      expect(res.statusCode).toBe(200);
      expect(res.body.meta.limit).toBe(5);
      expect(res.body.meta.offset).toBe(0);
    });

    it("rejects invalid projectId format", async () => {
      const res = await request(app).get("/projects/invalid-uuid/comments");
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /comments/:id/replies", () => {
    let parentCommentId;

    beforeEach(async () => {
      const parent = await postComment(projectId, token1, { message: "Parent for replies test" });
      parentCommentId = parent.body.data.id;

      await postComment(projectId, token2, { message: "Reply A", parentId: parentCommentId });
      await postComment(projectId, token1, { message: "Reply B", parentId: parentCommentId });
    });

    it("retrieves replies for a comment successfully", async () => {
      const res = await request(app).get(`/comments/${parentCommentId}/replies`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Replies retrieved successfully");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta).toBeDefined();
    });

    it("returns replies in chronological order", async () => {
      const res = await request(app).get(`/comments/${parentCommentId}/replies`);
      expect(res.statusCode).toBe(200);

      const replies = res.body.data;
      expect(replies[0].message).toBe("Reply A");
      expect(replies[1].message).toBe("Reply B");

      // Check chronological order
      expect(new Date(replies[0].createdAt).getTime()).toBeLessThan(new Date(replies[1].createdAt).getTime());
    });

    it("includes parent information in replies", async () => {
      const res = await request(app).get(`/comments/${parentCommentId}/replies`);
      expect(res.statusCode).toBe(200);

      const replies = res.body.data;
      replies.forEach((reply) => {
        expect(reply.parent).toBeDefined();
        expect(reply.parent.id).toBe(parentCommentId);
        expect(reply.parent.message).toBe("Parent for replies test");
        expect(reply.parent.User).toBeDefined();
      });
    });

    it("handles pagination for replies", async () => {
      const res = await request(app).get(`/comments/${parentCommentId}/replies?limit=1&offset=0`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.limit).toBe(1);
      expect(res.body.meta.total).toBe(2);
      expect(res.body.meta.hasNext).toBe(true);
    });

    it("returns 404 for non-existent comment", async () => {
      const res = await request(app).get("/comments/99999/replies");
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Comment not found");
    });

    it("rejects invalid comment ID format", async () => {
      const res = await request(app).get("/comments/not-a-number/replies");
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

    it("rejects invalid comment ID format", async () => {
      const res = await request(app)
        .put("/comments/not-a-number")
        .set("Authorization", `Bearer ${token1}`)
        .send({ message: messages.updated });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

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
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "message",
            message: "Comment is required",
          }),
          expect.objectContaining({
            field: "message",
            message: "Comment cannot be empty",
          }),
        ])
      );
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

    it("prevents updating a soft-deleted comment", async () => {
      const comment = await postComment(projectId, token1, { message: "Will be deleted" });
      const commentId = comment.body.data.id;

      await request(app).delete(`/comments/${commentId}`).set("Authorization", `Bearer ${token1}`);

      // Try to update the soft-deleted comment
      const res = await request(app)
        .put(`/comments/${commentId}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ message: "Trying to update deleted comment" });

      // Should return 403 because ownsEntity middleware can't find the entity
      // (soft deleted comments might not be returned by ownsEntity check)
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden, you do not own this entity.");
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

      const deletedComment = await db.Comment.findByPk(commentToDelete);
      expect(deletedComment).not.toBeNull();
      expect(deletedComment.isDeleted).toBe(true);
      expect(deletedComment.userId).toBeNull();
      expect(deletedComment.message).toBe("[deleted]");
    });

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

    it("rejects invalid comment ID format", async () => {
      const res = await request(app).delete("/comments/not-a-number").set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

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

    it("masks message of soft-deleted comments", async () => {
      const comment = await postComment(projectId, token1, { message: "This will be masked" });
      const commentId = comment.body.data.id;

      await request(app).delete(`/comments/${commentId}`).set("Authorization", `Bearer ${token1}`);

      const res = await request(app).get(`/projects/${projectId}/comments`);
      const deletedComment = res.body.data.find((c) => c.id === commentId);

      expect(deletedComment).toBeDefined();
      expect(deletedComment.message).toBe("[deleted]");
      expect(deletedComment.isDeleted).toBe(true);
    });

    it("preserves comment structure after soft delete (for replies)", async () => {
      const parent = await postComment(projectId, token1, { message: "Parent comment" });
      const reply = await postComment(projectId, token2, { message: "Reply comment", parentId: parent.body.data.id });

      await request(app).delete(`/comments/${parent.body.data.id}`).set("Authorization", `Bearer ${token1}`);

      const parentInDb = await db.Comment.findByPk(parent.body.data.id);
      expect(parentInDb).not.toBeNull();
      expect(parentInDb.isDeleted).toBe(true);

      const replyInDb = await db.Comment.findByPk(reply.body.data.id);
      expect(replyInDb.parentId).toBe(parent.body.data.id);
    });
  });
});
