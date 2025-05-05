var { db } = require("../models");
var { hashPassword } = require("../utilities/hashing");
var userRoles = require("./roles.json");
var deathTypes = require("./types.json");
var userAchievements = require("./achievements.json");
var dummyUsers = require("./users.json");
var userProjects = require("./projects.json");
var userComments = require("./comments.json");
var userVotes = require("./upVote.json");
var resurrectedProjects = require("./ResurrectionEvent.json");
var projectTombstones = require("./tombstones.json");

async function basicSeed() {
  let transaction;
  try {
    const hasRoles = await db.Role.findAll();
    const hasTypes = await db.Type.findAll();
    const hasAchievements = await db.Achievement.findAll();

    if (hasRoles.length > 0 || hasTypes.length > 0 || hasAchievements.length > 0) {
      console.log("Database already seeded with basics. Skipping seeding process.");
      return;
    }
    transaction = await db.sequelize.transaction();

    const [roles, types, achievements] = await Promise.all([
      db.Role.bulkCreate(userRoles, { transaction }),
      db.Type.bulkCreate(deathTypes, { transaction }),
      db.Achievement.bulkCreate(userAchievements, { transaction }),
    ]);

    if (!roles || !types || !achievements) {
      throw new Error("Failed to seed roles, types or achevements.");
    }

    await transaction.commit();
    console.log("Roles seeded successfully.");
  } catch (error) {
    console.error("Error seeding roles:", error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
  }
}

async function usersSeed() {
  let transaction;

  try {
    const hasUsers = await db.User.findAll();

    if (hasUsers.length > 0) {
      console.log("Database already seeded with users. Skipping seeding process.");
      return;
    }

    transaction = await db.sequelize.transaction();

    for (let i = 0; i < dummyUsers.length; i++) {
      const { salt, hashedPassword } = await hashPassword(dummyUsers[i].password);

      const user = await db.User.create(
        {
          ...dummyUsers[i],
          username: dummyUsers[i].username,
          email: dummyUsers[i].email,
          salt: salt,
          hashedPassword: hashedPassword,
        },
        { transaction }
      );

      if (!user) {
        throw new Error("Failed to create user.");
      }

      await user.setAchievements(dummyUsers[i].achievement, { transaction });
    }
    await transaction.commit();
    console.log("Users seeded successfully.");
  } catch (error) {
    console.error("Error seeding users:", error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
  }
}

async function projectsSeed() {
  let transaction;
  try {
    const hasProject = await db.Project.findAll();
    const users = await db.User.findAll();

    if (hasProject.length > 0) {
      console.log("Database already seeded with projects. Skipping seeding process.");
      return;
    }

    transaction = await db.sequelize.transaction();

    for (let i = 0; i < userProjects.length; i++) {
      const userId = users[userProjects[i].userId - 1].id;
      const project = await db.Project.create(
        {
          ...userProjects[i],
          userId: userId,
        },
        { transaction }
      );

      if (!project) {
        throw new Error("Failed to create project.");
      }
      await project.setTypes(userProjects[i].types, { transaction });
    }

    await transaction.commit();
    console.log("Projects seeded successfully.");
  } catch (error) {
    console.error("Error seeding projects:", error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
  }
}

async function moreSeed() {
  let transaction;
  try {
    const hasComments = await db.Comment.findAll();

    const users = await db.User.findAll();
    const projects = await db.Project.findAll();

    if (hasComments.length > 0) {
      console.log("Database already seeded with more. Skipping seeding process.");
      return;
    }

    transaction = await db.sequelize.transaction();

    for (let i = 0; i < userComments.length; i++) {
      const userId = users[userComments[i].userId - 1].id;
      const projectId = projects[userComments[i].projectId - 1].id;
      const comment = await db.Comment.create(
        {
          ...userComments[i],
          userId: userId,
          projectId: projectId,
        },
        { transaction }
      );
      if (!comment) {
        throw new Error("Failed to create comment.");
      }
    }

    for (let i = 0; i < userVotes.length; i++) {
      const userId = users[userVotes[i].userId - 1].id;
      const projectId = projects[userVotes[i].projectId - 1].id;
      const upVote = await db.Upvote.create(
        {
          ...userVotes[i],
          userId: userId,
          projectId: projectId,
        },
        { transaction }
      );
      if (!upVote) {
        throw new Error("Failed to create upVote.");
      }
    }
    for (let i = 0; i < resurrectedProjects.length; i++) {
      const projectId = projects[resurrectedProjects[i].projectId - 1].id;
      const resurrected = await db.ResurrectionEvent.create(
        {
          ...resurrectedProjects[i],
          projectId: projectId,
        },
        { transaction }
      );
      if (!resurrected) {
        throw new Error("Failed to resurrect.");
      }
    }

    await db.Tombstone.bulkCreate(projectTombstones, { transaction });

    await transaction.commit();
    console.log("More tables seeded successfully.");
  } catch (error) {
    console.error("Error seeding projects:", error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
  }
}

async function seed() {
  await basicSeed();
  await usersSeed();
  await projectsSeed();
  await moreSeed();
}

module.exports = seed;
