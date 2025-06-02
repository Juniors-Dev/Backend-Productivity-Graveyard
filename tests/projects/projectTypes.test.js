const request = require("supertest");
const { generateToken } = require("../../utilities/jwt");

function projectTypesTests({ app, db, testProject, createTestUser, badToken, expiredToken, cleanUp }) {
  describe("GET /projects routes", () => {
    let project;
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
      await project.setTypes([1, 2, 3, 4, 5]);

      projectId = project.id;

      if (user && user.id) {
        token = generateToken({
          id: user.id,
          email: user.email,
          username: user.username,
          roleId: user.roleId,
        });
      }

      if (user2 && user2.id) {
        token2 = generateToken({
          id: user2.id,
          email: user2.email,
          username: user2.username,
          roleId: user2.roleId,
        });
      }
    });

    afterAll(async () => {
      // Clean up: delete all projects and users
      await cleanUp([user.id, user2.id]);
    });

    describe("PUT /projects/:id/type", () => {
      it("should add a type to a project", async () => {
        const res = await request(app)
          .put(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token}`)
          .send({ typeId: 6 });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        const updatedProject = await db.Project.findByPk(projectId, {
          include: [{ model: db.Type, as: "types" }],
        });

        expect(updatedProject.types.map((t) => t.id)).toContain(6);
      });

      it("should not add a type without typeId", async () => {
        const res = await request(app)
          .put(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token}`)
          .send({});

        expect(res.statusCode).toBe(400);
      });

      it("should not add a type with invalid typeId", async () => {
        const res = await request(app)
          .put(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token}`)
          .send({ typeId: 9999 }); // Assuming 9999 does not exist

        expect(res.statusCode).toBe(404);
      });

      it("should not allow adding a type with an invalid token", async () => {
        const res = await request(app)
          .put(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${badToken}`)
          .send({ typeId: 7 });

        expect(res.statusCode).toBe(401);
      });

      it("should not allow adding a type with an expired token", async () => {
        const res = await request(app)
          .put(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${expiredToken}`)
          .send({ typeId: 8 });

        expect(res.statusCode).toBe(401);
      });

      it("should not allow adding a type with a token from another user", async () => {
        const res = await request(app)
          .put(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token2}`)
          .send({ typeId: 9 });

        expect(res.statusCode).toBe(403);
      });
    });

    describe("DELETE /projects/:id/type", () => {
      it("should remove a type from a project", async () => {
        const res = await request(app)
          .delete(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token}`)
          .send({ typeId: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it("should return 400 if typeId is missing", async () => {
        const res = await request(app)
          .delete(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token}`)
          .send({});

        expect(res.statusCode).toBe(400);
      });

      it("should return 404 if typeId does not exist", async () => {
        const res = await request(app)
          .delete(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token}`)
          .send({ typeId: 9999 }); // Assuming 9999 does not exist

        expect(res.statusCode).toBe(404);
      });

      it("should not allow removing a type with an invalid token", async () => {
        const res = await request(app)
          .delete(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${badToken}`)
          .send({ typeId: 2 });

        expect(res.statusCode).toBe(401);
      });

      it("should not allow removing a type with an expired token", async () => {
        const res = await request(app)
          .delete(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${expiredToken}`)
          .send({ typeId: 3 });

        expect(res.statusCode).toBe(401);
      });

      it("should not allow removing a type with a token from another user", async () => {
        const res = await request(app)
          .delete(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token2}`)
          .send({ typeId: 4 });

        expect(res.statusCode).toBe(403);
      });

      it("should return 404 if project does not exist", async () => {
        const res = await request(app)
          .delete(`/projects/00000000-0000-0000-0000-000000000000/type`)
          .set("Authorization", `Bearer ${token}`)
          .send({ typeId: 1 });

        expect(res.statusCode).toBe(404);
      });

      it("should return 401 if no token is provided", async () => {
        const res = await request(app).delete(`/projects/${projectId}/type`).send({ typeId: 5 });

        expect(res.statusCode).toBe(401);
      });

      it("should return 400 if request body is empty", async () => {
        const res = await request(app).delete(`/projects/${projectId}/type`).set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body).toHaveProperty("message");
        expect(Array.isArray(res.body.errors)).toBe(true);
      });

      it("should return 400 if typeId is not a number", async () => {
        const res = await request(app)
          .delete(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token}`)
          .send({ typeId: "not-a-number" });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body).toHaveProperty("message");
        expect(Array.isArray(res.body.errors)).toBe(true);
      });

      it("should return 400 if typeId is null", async () => {
        const res = await request(app)
          .delete(`/projects/${projectId}/type`)
          .set("Authorization", `Bearer ${token}`)
          .send({ typeId: null });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body).toHaveProperty("message");
        expect(Array.isArray(res.body.errors)).toBe(true);
      });
    });
  });
}

module.exports = projectTypesTests;
