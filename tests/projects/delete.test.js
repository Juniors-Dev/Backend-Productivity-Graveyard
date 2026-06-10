const request = require("supertest");
const { generateToken } = require("../../utilities/jwt");

function deleteTests({ app, db, testProject, createTestUser, badToken, expiredToken, cleanUp }) {
  describe("GET /projects routes", () => {
    let project;
    let project2;
    let project3;
    let projectId;
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

      project = await db.Project.create({
        ...testProject,
        userId: user.id,
      });

      project2 = await db.Project.create({
        ...testProject,
        userId: user.id,
      });

      project3 = await db.Project.create({
        ...testProject,
        userId: user.id,
      });

      projectId = project.id;

      if (user && user.id) {
        token = generateToken({
          id: user.id,
          email: user.email,
          username: user.username,
          role: role.name,
        });
      }

      if (user2 && user2.id) {
        token2 = generateToken({
          id: user2.id,
          email: user2.email,
          username: user2.username,
          role: role.name,
        });
      }
    });

    afterAll(async () => {
      // Clean up: delete all projects and users
      await cleanUp([user.id, user2.id]);
    });

    describe("DELETE /projects/:id", () => {
      it("should fail with missing token on delete", async () => {
        const res = await request(app).delete(`/projects/${projectId}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it("should fail with invalid token on delete", async () => {
        const res = await request(app).delete(`/projects/${projectId}`).set("Authorization", `Bearer ${badToken}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it("should fail with expired token on delete", async () => {
        const res = await request(app).delete(`/projects/${projectId}`).set("Authorization", `Bearer ${expiredToken}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it("should delete a project by owner", async () => {
        const res = await request(app).delete(`/projects/${projectId}`).set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it("should not allow non-owners to delete a project", async () => {
        const res = await request(app).delete(`/projects/${project2.id}`).set("Authorization", `Bearer ${token2}`);
        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
      });

      it("should not allow deletion of a non-existent project", async () => {
        const res = await request(app)
          .delete(`/projects/00000000-0000-0000-0000-000000000000`)
          .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
      });

      it("should not allow deletion of a project with an invalid ID format", async () => {
        const res = await request(app).delete(`/projects/invalid-id`).set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });
  });
}

module.exports = deleteTests;
