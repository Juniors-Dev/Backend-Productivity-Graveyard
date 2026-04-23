const request = require("supertest");
const { generateToken } = require("../../utilities/jwt");

function updateTests({ app, db, testProject, updateProject, createTestUser, badToken, expiredToken, cleanUp }) {
  describe("PUT /projects/:id", () => {
    let projectId;
    let project;
    let user;
    let user2;
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
      await cleanUp([user.id, user2.id]);
    });

    // Tests
    it("should fail with missing token on update", async () => {
      const res = await request(app).put(`/projects/${projectId}`).send({ name: "Updated Name" });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should update a project", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated Name");
    });

    it("should not update a project with invalid token", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer invalidtoken`)
        .send({ name: "Another Update" });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should not update a project with expired token", async () => {
      // await new Promise((r) => setTimeout(r, 1001));
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({ name: "Another Update" });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should not update a project with bad token", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${badToken}`)
        .send({ name: "Another Update" });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should not update a project without request body", async () => {
      const res = await request(app).put(`/projects/${project.id}`).set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it("should not update a project with invalid data", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name", message: "Name can't be empty" })])
      );
    });

    it("should not update a projects startDate without a provided endDate", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ startDate: "2023-01-01" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "", message: "Both startDate and endDate must be provided together" }),
        ])
      );
    });

    it("should not update a projects endDate without a provided startDate", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ endDate: "2023-12-31" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "", message: "Both startDate and endDate must be provided together" }),
        ])
      );
    });

    it("should not update a project with endDate before startDate", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ startDate: "2023-12-31", endDate: "2023-01-01" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "endDate", message: "End date must be after start date" }),
        ])
      );
    });

    it("should not update a project with invalid tombstoneId", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ tombstoneId: "invalid" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "tombstoneId", message: "Tombstone ID must be a number" }),
        ])
      );
    });

    it("should not update a project with non-existent tombstoneId", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ tombstoneId: 999999 });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Tombstone not found");
    });

    it("should not update a project with invalid status", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "invalid_status" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "status",
            message:
              "status must be one of the following values: inactive, active, buried, resurrected, completed, archived",
          }),
        ])
      );
    });

    it("should not update a project with non-existent ID", async () => {
      const res = await request(app)
        .put(`/projects/00000000-0000-0000-0000-000000000000`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Non-existent Project" });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Project not found");
    });

    it("should not update a project with invalid ID format", async () => {
      const res = await request(app)
        .put(`/projects/invalid-id-format`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Invalid ID Format" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation Error: Invalid UUID format");
    });

    it("should not update a project with insufficient permissions", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token2}`)
        .send({ name: "Unauthorized Update" });
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden, you do not own this entity.");
    });

    it("should update a project with all fields", async () => {
      const res = await request(app)
        .put(`/projects/${project.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ ...updateProject });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateProject.name);
      expect(res.body.data.description).toBe(updateProject.description);
      expect(res.body.data.causeOfDeath).toBe(updateProject.causeOfDeath);
      expect(res.body.data.status).toBe(updateProject.status);
      expect(res.body.data.startDate.slice(0, 10)).toBe(updateProject.startDate);
      expect(res.body.data.endDate.slice(0, 10)).toBe(updateProject.endDate);
      expect(res.body.data.eulogy).toBe(updateProject.eulogy);
    });
  });
}

module.exports = updateTests;
