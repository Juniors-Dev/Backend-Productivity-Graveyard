const request = require("supertest");
const { generateToken } = require("../../utilities/jwt");

function createTests({ app, db, testProject, createTestUser, badToken, expiredToken, cleanUp }) {
  describe("POST /projects", () => {
    let user;
    beforeAll(async () => {
      await db.sequelize.authenticate();
      const role = await db.Role.findOne({ where: { name: "user" } });

      await db.User.destroy({
        where: { email: [createTestUser("1", role.id).email] },
        force: true,
      });

      user = await db.User.create(createTestUser("1", role.id));

      token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
        roleId: user.roleId,
      });
    });

    afterAll(async () => {
      // Clean up: delete all projects and user
      await cleanUp([user.id]);
    });

    // Tests
    it("should create a new project", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      projectId = res.body.data.id;
    });

    it("should not create a project without auth", async () => {
      const res = await request(app)
        .post("/projects")
        .send({ ...testProject });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should not create a project with invalid token", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer invalidtoken`)
        .send({ ...testProject });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should not create a project with expired token", async () => {
      //await new Promise((r) => setTimeout(r, 1001));
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({ ...testProject });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should not create a project with bad token", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${badToken}`)
        .send({ ...testProject });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("shouldn't create a project without request body", async () => {
      const res = await request(app).post("/projects").set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it("shouldn't create a project without name", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, name: "" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name", message: "Name is required" })])
      );
    });

    it("shouldn't create a project with too long name", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, name: "a".repeat(101) });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "name", message: "Name must be under 100 characters" }),
        ])
      );
    });

    it("shouldn't create a project without description", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, description: "" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "description", message: "Description is required" })])
      );
    });

    it("shouldn't create a project with too long description", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, description: "a".repeat(501) });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "description", message: "Description must be under 500 characters" }),
        ])
      );
    });

    it("shouldn't create a project without cause of death", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, causeOfDeath: "" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "causeOfDeath", message: "Cause of death is required" }),
        ])
      );
    });

    it("shouldn't create a project with too long cause of death", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, causeOfDeath: "a".repeat(101) });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "causeOfDeath", message: "Keep cause of death under 100 characters" }),
        ])
      );
    });

    it("shouldn't create a project without start date", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, startDate: "" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "startDate", message: "Start date is required" })])
      );
    });

    it("shouldn't create a project with invalid start date", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, startDate: "invalid-date" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "startDate", message: "Start date must be a valid date" }),
        ])
      );
    });

    it("shouldn't create a project without end date", async () => {
      const noEndDateProject = { ...testProject };
      delete noEndDateProject.endDate;
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...noEndDateProject });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "endDate", message: "End date is required" })])
      );
    });

    it("shouldn't create a project with invalid end date", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, endDate: "invalid-date" });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "endDate", message: "End date must be a valid date" }),
        ])
      );
    });

    it("shouldn't create a project with end date before start date", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, startDate: "2024-10-01", endDate: "2024-09-30" });
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

    it("shouldn't create a project without types", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, types: [] });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "types", message: "At least one type must be selected" }),
        ])
      );
    });

    it("shouldn't create a project with non-existent type", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, types: [9999] });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Some types do not exist");
    });

    it("shouldn't create a project with duplicate types", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, types: [2, 2, 3] });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "types", message: "Cannot contain duplicate types." }),
        ])
      );
    });

    it("shouldn't create a project with non-numeric tombstoneId", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, tombstoneId: "not-a-number" });
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

    it("shouldn't create a project with non-existent tombstoneId", async () => {
      const res = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...testProject, tombstoneId: 9999 });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Tombstone not found");
    });
  });
}

module.exports = createTests;
