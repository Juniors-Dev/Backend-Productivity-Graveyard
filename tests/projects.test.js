const request = require("supertest");
const app = require("../app");
const { generateToken } = require("../utilities/jwt");
const jwt = require("jsonwebtoken");
const { db } = require("../models");

const createTestUser = (suffix = "", roleId) => ({
  firstName: "Crash",
  lastName: `Test`,
  username: `Dummy${suffix}`,
  email: `supertester${suffix}@example.com`,
  hashedPassword: "testhash",
  salt: "testsalt",
  roleId: roleId,
});

const testProject = {
  name: "Productivity Graveyard",
  description: "A humorous app to memorialize abandoned dev projects.",
  causeOfDeath: "Dog Puked on the server",
  status: "archived",
  startDate: "2024-10-01",
  endDate: "2025-01-15",
  eulogy: "Laid to rest after haunting VS Code for too long. Survived by hundreds of unused TODOs.",
  types: [2, 3],
  tombstoneId: 1, // Assuming tombstoneId 1 exists
};

const updateProject = {
  name: "Updated Productivity Graveyard",
  description: "An updated description for the project.",
  causeOfDeath: "Server was haunted by ghosts of past developers.",
  status: "active",
  startDate: "2024-09-01",
  endDate: "2025-02-15",
  eulogy: "Now with more ghost stories and fewer bugs.",
};

describe("Projects API", () => {
  let token;
  let token2;
  const badToken = jwt.sign({ id: "invalid", email: "a@a.com", username: "baduser", roleId: 1 }, "invalidsecret", {
    expiresIn: "1h",
  });
  const expiredToken = jwt.sign(
    { id: "expired", email: "a@a.com", username: "expireduser", roleId: 1, exp: Math.floor(Date.now() / 1000) - 1 },
    process.env.JWT_SECRET
  );
  let projectId;
  let project;
  let user;
  let user2;

  beforeAll(async () => {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ force: false });
    const role = await db.Role.findOne({ where: { name: "user" } });

    await db.User.destroy({
      where: { email: [createTestUser("1", role.id).email, createTestUser("2", role.id).email] },
      force: true,
    });

    user = await db.User.create(createTestUser("1", role.id));
    user2 = await db.User.create(createTestUser("2", role.id));

    token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
    });

    token2 = generateToken({
      id: user2.id,
      email: user2.email,
      username: user2.username,
      roleId: user2.roleId,
    });

    project = await db.Project.create({
      ...testProject,
      userId: user.id,
    });
  });

  afterAll(async () => {
    // Clean up: delete all projects and user
    await db.Project.destroy({ where: { userId: [user.id, user2.id] }, force: true });
    await db.User.destroy({ where: { id: [user.id, user2.id] }, force: true });
    await db.sequelize.close();
  });

  describe("POST /projects", () => {
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
      expect(res.body.errors).toContain("Name is required");
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
      expect(res.body.errors).toContain("Name must be under 100 characters");
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
      expect(res.body.errors).toContain("Description is required");
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
      expect(res.body.errors).toContain("Description must be under 500 characters");
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
      expect(res.body.errors).toContain("Cause of death is required");
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
      expect(res.body.errors).toContain("Keep cause of death under 255 characters");
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
      expect(res.body.errors).toContain("Start date is required");
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
      expect(res.body.errors).toContain("Start date must be a valid date");
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
      expect(res.body.errors).toContain("End date is required");
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
      expect(res.body.errors).toContain("End date must be a valid date");
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
      expect(res.body.errors).toContain("End date must be after start date");
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
      expect(res.body.errors).toContain("At least one type must be selected");
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
      expect(res.body.errors).toContain("Cannot contain duplicate types.");
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
      expect(res.body.errors).toContain("Tombstone ID must be a number");
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

  // -------------- PUT ----------------

  describe("PUT /projects/:id", () => {
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

    //   it("should not update a project with invalid token", async () => {
    //     const res = await request(app)
    //       .put(`/projects/${project.id}`)
    //       .set("Authorization", `Bearer invalidtoken`)
    //       .send({ name: "Another Update" });
    //     expect(res.statusCode).toBe(401);
    //     expect(res.body.success).toBe(false);
    //   });

    //   it("should not update a project with expired token", async () => {
    //     // await new Promise((r) => setTimeout(r, 1001));
    //     const res = await request(app)
    //       .put(`/projects/${project.id}`)
    //       .set("Authorization", `Bearer ${expiredToken}`)
    //       .send({ name: "Another Update" });
    //     expect(res.statusCode).toBe(401);
    //     expect(res.body.success).toBe(false);
    //   });

    //   it("should not update a project with bad token", async () => {
    //     const res = await request(app)
    //       .put(`/projects/${project.id}`)
    //       .set("Authorization", `Bearer ${badToken}`)
    //       .send({ name: "Another Update" });
    //     expect(res.statusCode).toBe(401);
    //     expect(res.body.success).toBe(false);
    //   });

    //   it("should not update a project without request body", async () => {
    //     const res = await request(app).put(`/projects/${project.id}`).set("Authorization", `Bearer ${token}`);
    //     expect(res.statusCode).toBe(400);
    //     expect(res.body.success).toBe(false);
    //     expect(res.body).toHaveProperty("message");
    //     expect(Array.isArray(res.body.errors)).toBe(true);
    //   });

    //   it("should not update a project with invalid data", async () => {
    //     const res = await request(app)
    //       .put(`/projects/${project.id}`)
    //       .set("Authorization", `Bearer ${token}`)
    //       .send({ name: "" });
    //     expect(res.statusCode).toBe(400);
    //     expect(res.body.success).toBe(false);
    //     expect(res.body).toHaveProperty("message");
    //     expect(Array.isArray(res.body.errors)).toBe(true);
    //     expect(res.body.errors).toContain("Name is required");
    //   });

    //   it("should not update a project with non-existent ID", async () => {
    //     const res = await request(app)
    //       .put(`/projects/00000000-0000-0000-0000-000000000000`)
    //       .set("Authorization", `Bearer ${token}`)
    //       .send({ name: "Non-existent Project" });
    //     expect(res.statusCode).toBe(404);
    //     expect(res.body.success).toBe(false);
    //     expect(res.body.message).toBe("Project not found");
    //   });

    //   it("should not update a project with insufficient permissions", async () => {
    //     const res = await request(app)
    //       .put(`/projects/${project.id}`)
    //       .set("Authorization", `Bearer ${token2}`)
    //       .send({ name: "Unauthorized Update" });
    //     expect(res.statusCode).toBe(403);
    //     expect(res.body.success).toBe(false);
    //     expect(res.body.message).toBe("Forbidden, you do not own this entity.");
    //   });

    //   it("should update a project with all fields", async () => {
    //     const res = await request(app)
    //       .put(`/projects/${project.id}`)
    //       .set("Authorization", `Bearer ${token}`)
    //       .send({ ...updateProject });
    //     expect(res.statusCode).toBe(200);
    //     expect(res.body.success).toBe(true);
    //     expect(res.body.data.name).toBe(updateProject.name);
    //     expect(res.body.data.description).toBe(updateProject.description);
    //     expect(res.body.data.causeOfDeath).toBe(updateProject.causeOfDeath);
    //     expect(res.body.data.status).toBe(updateProject.status);
    //     expect(res.body.data.startDate).toBe(updateProject.startDate);
    //     expect(res.body.data.endDate).toBe(updateProject.endDate);
    //     expect(res.body.data.eulogy).toBe(updateProject.eulogy);
    //   });
  });

  // -------------- GET ----------------

  // it("should add a type to the project", async () => {
  //   const res = await request(app)
  //     .put(`/projects/${projectId}/type`)
  //     .set("Authorization", `Bearer ${token}`)
  //     .send({ typeId: 2 });
  //   expect([200, 409]).toContain(res.statusCode); // 409 if already exists
  //   expect(res.body).toHaveProperty("success");
  // });

  // it("should remove a type from the project", async () => {
  //   const res = await request(app)
  //     .delete(`/projects/${projectId}/type`)
  //     .set("Authorization", `Bearer ${token}`)
  //     .send({ typeId: 2 });
  //   expect(res.statusCode).toBe(200);
  //   expect(res.body.success).toBe(true);
  // });

  // it("should delete the project", async () => {
  //   const res = await request(app).delete(`/projects/${projectId}`).set("Authorization", `Bearer ${token}`);
  //   expect([200, 204]).toContain(res.statusCode);
  // });
  // it("should get a project by id", async () => {
  //   const res = await request(app).get(`/projects/${project.id}`).set("Authorization", `Bearer ${token}`);
  //   expect(res.statusCode).toBe(200);
  //   expect(res.body.success).toBe(true);
  //   expect(res.body.data).toHaveProperty("id", project.id);
  // });

  // it("should return 404 for non-existent project", async () => {
  //   const res = await request(app)
  //     .get("/projects/00000000-0000-0000-0000-000000000000")
  //     .set("Authorization", `Bearer ${token}`);
  //   expect(res.statusCode).toBe(404);
  //   expect(res.body.success).toBe(false);
  // });
});
