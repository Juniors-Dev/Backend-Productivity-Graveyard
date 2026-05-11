const request = require("supertest");
const app = require("../app");
const { generateToken } = require("../utilities/jwt");
const jwt = require("jsonwebtoken");
const { db } = require("../models");
const createTests = require("./projects/create.test.js");
const updateTests = require("./projects/update.test.js");
const getTests = require("./projects/get.test.js");
const deleteTests = require("./projects/delete.test.js");
const projectTypesTests = require("./projects/projectTypes.test.js");

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
  status: "buried",
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

async function cleanUp(usersIds = []) {
  await db.Project.destroy({ where: { userId: usersIds }, force: true });
  await db.User.destroy({ where: { id: usersIds }, force: true });
}

describe("Projects API", () => {
  const badToken = jwt.sign({ id: "invalid", email: "a@a.com", username: "baduser", role: "user" }, "invalidsecret", {
    expiresIn: "1h",
  });
  const expiredToken = jwt.sign(
    { id: "expired", email: "a@a.com", username: "expireduser", role: "user", exp: Math.floor(Date.now() / 1000) - 1 },
    process.env.JWT_SECRET
  );

  afterAll(async () => {
    await db.sequelize.close();
  });

  const config = { app, db, testProject, updateProject, createTestUser, badToken, expiredToken, cleanUp };

  // -------------- POST ----------------
  createTests(config);

  // -------------- PUT ----------------
  updateTests(config);

  // -------------- GET ----------------
  getTests(config);

  // -------------- DELETE ----------------
  deleteTests(config);

  // ---------- Type Tests --------------
  projectTypesTests(config);
});
