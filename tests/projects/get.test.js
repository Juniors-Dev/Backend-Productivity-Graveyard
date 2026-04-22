const request = require("supertest");
const { generateToken } = require("../../utilities/jwt");

function getTests({ app, db, testProject, createTestUser, badToken, expiredToken, cleanUp }) {
  describe("GET /projects routes", () => {
    let project;
    let project2;
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
      await project.setTypes([1, 2, 3]);

      project2 = await db.Project.create({
        ...testProject,
        name: "Another Project",
        userId: user2.id,
      });
      await project2.setTypes([4, 5, 6]);

      //create upvote
      await db.Upvote.create({
        userId: user2.id,
        projectId: project.id,
      });

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

    describe("GET /projects", () => {
      it("should get all project without token", async () => {
        const res = await request(app).get("/projects");
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].userHasVoted).toBe(null);
      });

      it("should get all projects with valid token", async () => {
        const res = await request(app).get("/projects").set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it("shouldn't get projects with invalid token", async () => {
        const res = await request(app).get("/projects").set("Authorization", `Bearer ${badToken}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Unauthorized, invalid or expired token.");
      });

      it("should return a specific users projects", async () => {
        const res = await request(app)
          .get("/projects")
          .set("Authorization", `Bearer ${token}`)
          .query({ userId: user.id });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].userId).toBe(user.id);
      });

      it("should limit the number of projects returned", async () => {
        const res = await request(app).get("/projects").set("Authorization", `Bearer ${token}`).query({ limit: 1 });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(1);
      });

      it("should skip a number of projects", async () => {
        const res = await request(app)
          .get("/projects")
          .set("Authorization", `Bearer ${token}`)
          .query({ limit: 1, offset: 1 });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(1);
      });

      it("should filter projects by status", async () => {
        const res = await request(app)
          .get("/projects")
          .set("Authorization", `Bearer ${token}`)
          .query({ status: "buried" });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        res.body.data.forEach((project) => {
          expect(project.status).toBe("buried");
        });
      });

      it("should sort projects by createdAt in descending order", async () => {
        const res = await request(app)
          .get("/projects")
          .set("Authorization", `Bearer ${token}`)
          .query({ orderBy: "createdAt", order: "DESC" });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].createdAt >= res.body.data[1].createdAt).toBe(true);
      });

      it("should sort projects by name in ascending order", async () => {
        const res = await request(app)
          .get("/projects")
          .set("Authorization", `Bearer ${token}`)
          .query({ orderBy: "name", order: "ASC" });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].name <= res.body.data[1].name).toBe(true);
      });

      it("should filter projects by types", async () => {
        const res = await request(app)
          .get("/projects")
          .set("Authorization", `Bearer ${token}`)
          .query({ types: "1,2,3" });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        res.body.data.forEach((project) => {
          expect(project.types.map((type) => type.id).some((types) => [1, 2, 3].includes(types))).toBe(true);
        });
      });

      it("should search projects by name", async () => {
        const res = await request(app)
          .get("/projects")
          .set("Authorization", `Bearer ${token}`)
          .query({ query: "Productivity" });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        res.body.data.forEach((project) => {
          expect(project.name.toLowerCase()).toContain("productivity");
        });
      });

      // Future tests for validation errors on parameters once they are more fleshed out

      // it("should return 400 for invalid query parameters", async () => {
      //   const res = await request(app)
      //     .get("/projects")
      //     .set("Authorization", `Bearer ${token}`)
      //     .query({ limit: "invalid", offset: "invalid" });
      //   expect(res.statusCode).toBe(400);
      //   expect(res.body.success).toBe(false);
      //   expect(res.body.message).toBe("Validation Error: Invalid query parameters");
      // });

      // it("should return 400 for invalid status", async () => {
      //   const res = await request(app)
      //     .get("/projects")
      //     .set("Authorization", `Bearer ${token}`)
      //     .query({ status: "invalid" });
      //   expect(res.statusCode).toBe(400);
      //   expect(res.body.success).toBe(false);
      //   expect(res.body.message).toBe("Validation Error: Invalid status");
      // });

      // it("should return 400 for invalid status type", async () => {
      //   const res = await request(app).get("/projects").set("Authorization", `Bearer ${token}`).query({ status: 123 });
      //   expect(res.statusCode).toBe(400);
      //   expect(res.body.success).toBe(false);
      //   expect(res.body.message).toBe("Validation Error: Status must be a string");
      // });

      // it("should return 400 for invalid types", async () => {
      //   const res = await request(app)
      //     .get("/projects")
      //     .set("Authorization", `Bearer ${token}`)
      //     .query({ types: "invalid" });
      //   expect(res.statusCode).toBe(400);
      //   expect(res.body.success).toBe(false);
      //   expect(res.body.message).toBe("Validation Error: Invalid types format");
      // });
    });

    describe("GET /projects/:id", () => {
      it("should get a project by id without token", async () => {
        const res = await request(app).get(`/projects/${project.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("id", project.id);
      });

      it("should get a project by id, with token and have voting status", async () => {
        const res = await request(app).get(`/projects/${project.id}`).set("Authorization", `Bearer ${token2}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("id", project.id);
        expect(res.body.data.userHasVoted).toBe(true);
      });

      it("should not get a project by id with invalid token", async () => {
        const res = await request(app).get(`/projects/${project.id}`).set("Authorization", `Bearer ${badToken}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Unauthorized, invalid or expired token.");
      });

      it("should return 404 for non-existent project", async () => {
        const res = await request(app)
          .get("/projects/00000000-0000-0000-0000-000000000000")
          .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
      });

      it("should return validation error for invalid project ID", async () => {
        const res = await request(app).get("/projects/invalid-id").set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Validation Error: Invalid UUID format");
      });
    });

    describe("GET /projects/types, /projects/tombstones", () => {
      // Get Types
      it("should get all project types without token", async () => {
        const res = await request(app).get("/projects/types");
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      // Get Tombstones
      it("should get all project tombstones without token", async () => {
        const res = await request(app).get("/projects/tombstones");
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });
  });
}

module.exports = getTests;
