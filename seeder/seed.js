var { hashPassword } = require("../utilities/hashing");
var userRoles = require("./roles.json");
var deathTypes = require("./types.json");
var userAchievements = require("./achievements.json");
var dummyUsers = require("./users.json");
var projects = require("./projects.json");
var userComments = require("./comments.json");
var userVotes = require("./upVote.json");
var resurrectedProjects = require("./ResurrectionEvent.json");
var projectTombstones = require("./tombstones.json");

async function basicSeed(db) {
  let transaction;
  try {
    const hasRoles = await db.Role.findAll();
    const hasTypes = await db.Type.findAll();
    const hasAchievements = await db.Achievement.findAll();
    const hasTombstones = await db.Tombstone.findAll();

    if (hasRoles.length > 0 || hasTypes.length > 0 || hasAchievements.length > 0 || hasTombstones.length > 0) {
      console.log("Database already seeded with basics. Skipping seeding process.");
      return;
    }
    transaction = await db.sequelize.transaction();

    const [roles, types, achievements, tombstones] = await Promise.all([
      db.Role.bulkCreate(userRoles, { transaction }),
      db.Type.bulkCreate(deathTypes, { transaction }),
      db.Achievement.bulkCreate(userAchievements, { transaction }),
      db.Tombstone.bulkCreate(projectTombstones, { transaction }),
    ]);

    if (!roles || !types || !achievements || !tombstones) {
      throw new Error("Failed to seed roles, types, tombstones or achevements.");
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

async function usersSeed(db) {
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

async function projectsSeed(db) {
  let transaction;
  try {
    const hasProjects = await db.Project.count();

    if (hasProjects > 0) {
      console.log("Database already seeded with projects. Skipping seeding process.");
      return;
    }

    const users = await db.User.findAll({ attributes: ["id"] });

    if (users.length === 0) {
      throw new Error("No users found. Cannot seed projects without users.");
    }
    const userIds = users.map((u) => u.id);

    transaction = await db.sequelize.transaction();

    const formattedProjects = projects.map((project, index) => {
      return {
        ...project,
        userId: userIds[(project.userId - 1) % userIds.length],
        tombstoneId: project.tombstoneId || (index % 20) + 1, // fallback if not explicitly set
      };
    });

    // Bulk create projects
    const createdProjects = await db.Project.bulkCreate(formattedProjects, {
      transaction,
      returning: true,
    });

    // Handle many-to-many for types
    for (let i = 0; i < createdProjects.length; i++) {
      const types = projects[i].types;
      if (types && types.length > 0) {
        await createdProjects[i].setTypes(types, { transaction });
      }
    }

    await transaction.commit();
    console.log("Project seeding complete.");
  } catch (error) {
    console.error("Error seeding projects:", error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
  }
}

async function moreSeed(db) {
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

async function seed(db) {
  await basicSeed(db);
  await usersSeed(db);
  await projectsSeed(db);
  await moreSeed(db);
}

module.exports = seed;
