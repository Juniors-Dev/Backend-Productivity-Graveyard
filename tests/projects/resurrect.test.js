const request = require("supertest");
const { generateToken } = require("../../utilities/jwt");

function resurrectTests({ app, db, testProject, createTestUser, badToken, expiredToken, cleanUp }) {
  describe("PUT /projects/:id/resurrect", () => {
    let buriedProject;
    let buriedProjectForOwnershipTest;
    let projectFor255CharTest;
    let alreadyResurrectedProject;
    let activeProject;
    let user;
    let user2;
    let token;
    let token2;

    beforeAll(async () => {
      await db.sequelize.authenticate();
      const role = await db.Role.findOne({ where: { name: "user" } });

      await db.User.destroy({
        where: { email: [createTestUser("1", role.id).email, createTestUser("2", role.id).email] },
        force: true,
      });

      user = await db.User.create(createTestUser("1", role.id));
      user2 = await db.User.create(createTestUser("2", role.id));

      buriedProject = await db.Project.create({ ...testProject, status: "buried", userId: user.id });
      buriedProjectForOwnershipTest = await db.Project.create({ ...testProject, status: "buried", userId: user.id });
      projectFor255CharTest = await db.Project.create({ ...testProject, status: "buried", userId: user.id });
      alreadyResurrectedProject = await db.Project.create({ ...testProject, status: "resurrected", userId: user.id });
      activeProject = await db.Project.create({ ...testProject, status: "active", userId: user.id });

      token = generateToken({ id: user.id, email: user.email, username: user.username, role: role.name });
      token2 = generateToken({ id: user2.id, email: user2.email, username: user2.username, role: role.name });
    });

    afterAll(async () => {
      await cleanUp([user.id, user2.id]);
    });

    it("should resurrect a buried project, return the updated project, and create a ResurrectionEvent", async () => {
      const reason = "Found a co-founder willing to restart this with me.";
      const res = await request(app)
        .put(`/projects/${buriedProject.id}/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(buriedProject.id);
      expect(res.body.data.status).toBe("resurrected");

      const event = await db.ResurrectionEvent.findOne({ where: { projectId: buriedProject.id } });
      expect(event).not.toBeNull();
      expect(event.projectId).toBe(buriedProject.id);
      expect(event.reason).toBe(reason);
      expect(event.resurrectedAt).toBeInstanceOf(Date);
      expect(Date.now() - event.resurrectedAt.getTime()).toBeLessThan(5000);
      expect(event.isCompleted).toBe(false);
      expect(event.buriedAgain).toBeNull();
    });

    it("should not create a ResurrectionEvent when resurrection is rejected", async () => {
      await request(app)
        .put(`/projects/${activeProject.id}/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "This should fail." });

      const events = await db.ResurrectionEvent.findAll({ where: { projectId: activeProject.id } });
      expect(events).toHaveLength(0);
    });

    it("should return 409 when project is already resurrected", async () => {
      const res = await request(app)
        .put(`/projects/${alreadyResurrectedProject.id}/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Trying again." });
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should return 409 when project status is active, not buried", async () => {
      const res = await request(app)
        .put(`/projects/${activeProject.id}/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "This project is active." });
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should return 403 when a non-owner tries to resurrect a buried project", async () => {
      const res = await request(app)
        .put(`/projects/${buriedProjectForOwnershipTest.id}/resurrect`)
        .set("Authorization", `Bearer ${token2}`)
        .send({ reason: "Not my project to resurrect." });
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);

      const project = await db.Project.findByPk(buriedProjectForOwnershipTest.id);
      expect(project.status).toBe("buried");
    });

    it("should return 401 with no token", async () => {
      const res = await request(app)
        .put(`/projects/${buriedProject.id}/resurrect`)
        .send({ reason: "Ghost in the machine." });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .put(`/projects/${buriedProject.id}/resurrect`)
        .set("Authorization", `Bearer ${badToken}`)
        .send({ reason: "Ghost in the machine." });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 with expired token", async () => {
      const res = await request(app)
        .put(`/projects/${buriedProject.id}/resurrect`)
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({ reason: "Ghost in the machine." });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 for a non-existent project", async () => {
      const res = await request(app)
        .put(`/projects/00000000-0000-0000-0000-000000000000/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Into the void." });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 for an invalid project ID format", async () => {
      const res = await request(app)
        .put(`/projects/not-a-uuid/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Ghost in the machine." });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when reason is missing", async () => {
      const res = await request(app)
        .put(`/projects/${buriedProject.id}/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when reason is whitespace only", async () => {
      const res = await request(app)
        .put(`/projects/${buriedProject.id}/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "   " });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when unknown fields are sent", async () => {
      const res = await request(app)
        .put(`/projects/${buriedProject.id}/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Valid reason.", sneaky: "field" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should accept a reason of exactly 255 characters", async () => {
      const res = await request(app)
        .put(`/projects/${projectFor255CharTest.id}/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "x".repeat(255) });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 400 when reason exceeds 255 characters", async () => {
      const res = await request(app)
        .put(`/projects/${buriedProject.id}/resurrect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "x".repeat(256) });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should only succeed once when two requests race to resurrect the same project", async () => {
      const racer = await db.Project.create({ ...testProject, status: "buried", userId: user.id });

      const [a, b] = await Promise.all([
        request(app)
          .put(`/projects/${racer.id}/resurrect`)
          .set("Authorization", `Bearer ${token}`)
          .send({ reason: "First to the finish." }),
        request(app)
          .put(`/projects/${racer.id}/resurrect`)
          .set("Authorization", `Bearer ${token}`)
          .send({ reason: "Second attempt." }),
      ]);

      const codes = [a.statusCode, b.statusCode].sort();
      expect(codes).toEqual([200, 409]);

      const events = await db.ResurrectionEvent.findAll({ where: { projectId: racer.id } });
      expect(events).toHaveLength(1);
    });
  });
}

module.exports = resurrectTests;
