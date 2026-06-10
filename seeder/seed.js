const { hashPassword } = require("../utilities/hashing");
const userRoles = require("./roles.json");
const deathTypes = require("./types.json");
const userAchievements = require("./achievements.json");
const dummyUsers = require("./users.json");
const projects = require("./projects.json");
const userComments = require("./comments.json");
const userVotes = require("./upVote.json");
const resurrectedProjects = require("./ResurrectionEvent.json");
const projectTombstones = require("./tombstones.json");

async function staticSeed(db) {
  const [roleCount, typeCount, achievementCount, tombstoneCount] = await Promise.all([
    db.Role.count(),
    db.Type.count(),
    db.Achievement.count(),
    db.Tombstone.count(),
  ]);

  if (roleCount && typeCount && achievementCount && tombstoneCount) {
    console.log("Static data already seeded. Skipping.");
    return;
  }

  await db.sequelize.transaction(async (t) => {
    const tasks = [];
    if (!roleCount) tasks.push(db.Role.bulkCreate(userRoles, { transaction: t }));
    if (!typeCount) tasks.push(db.Type.bulkCreate(deathTypes, { transaction: t }));
    if (!achievementCount) tasks.push(db.Achievement.bulkCreate(userAchievements, { transaction: t }));
    if (!tombstoneCount) tasks.push(db.Tombstone.bulkCreate(projectTombstones, { transaction: t }));
    await Promise.all(tasks);
  });

  console.log("Static data seeded.");
}

async function usersSeed(db) {
  const userCount = await db.User.count();
  if (userCount > 0) {
    console.log("Users already seeded. Skipping.");
    return;
  }

  await db.sequelize.transaction(async (t) => {
    for (const dummyUser of dummyUsers) {
      const { salt, hashedPassword } = await hashPassword(dummyUser.password);
      const user = await db.User.create(
        {
          ...dummyUser,
          salt,
          isEmailVerified: false,
          hashedPassword,
        },
        { transaction: t }
      );
      await user.setAchievements(dummyUser.achievement, { transaction: t });
    }
  });

  console.log("Users seeded.");
}

async function projectsSeed(db) {
  const projectCount = await db.Project.count();
  if (projectCount > 0) {
    console.log("Projects already seeded. Skipping.");
    return;
  }

  const usersByUsername = new Map(
    (await db.User.findAll({ attributes: ["id", "username"] })).map((u) => [u.username, u.id])
  );

  if (usersByUsername.size === 0) {
    throw new Error("No users found. Cannot seed projects without users.");
  }

  await db.sequelize.transaction(async (t) => {
    const formattedProjects = projects.map((project) => ({
      ...project,
      userId: usersByUsername.get(project.username),
    }));

    const createdProjects = await db.Project.bulkCreate(formattedProjects, {
      transaction: t,
      returning: true,
    });

    for (let i = 0; i < createdProjects.length; i++) {
      const types = projects[i].types;
      if (types && types.length > 0) {
        await createdProjects[i].setTypes(types, { transaction: t });
      }
    }
  });

  console.log("Projects seeded.");
}

async function moreSeed(db) {
  const commentCount = await db.Comment.count();
  if (commentCount > 0) {
    console.log("Comments, votes and resurrection events already seeded. Skipping.");
    return;
  }

  const [usersByUsername, projectsByName] = await Promise.all([
    db.User.findAll({ attributes: ["id", "username"] }).then((rows) => new Map(rows.map((u) => [u.username, u.id]))),
    db.Project.findAll({ attributes: ["id", "name"] }).then((rows) => new Map(rows.map((p) => [p.name, p.id]))),
  ]);

  await db.sequelize.transaction(async (t) => {
    for (const comment of userComments) {
      await db.Comment.create(
        {
          ...comment,
          userId: usersByUsername.get(comment.username),
          projectId: projectsByName.get(comment.projectName),
        },
        { transaction: t }
      );
    }

    for (const vote of userVotes) {
      await db.Upvote.create(
        {
          ...vote,
          userId: usersByUsername.get(vote.username),
          projectId: projectsByName.get(vote.projectName),
        },
        { transaction: t }
      );
    }

    for (const event of resurrectedProjects) {
      await db.ResurrectionEvent.create(
        {
          ...event,
          projectId: projectsByName.get(event.projectName),
        },
        { transaction: t }
      );
    }
  });

  console.log("Comments, votes and resurrection events seeded.");
}

async function seed(db) {
  await staticSeed(db);
  await usersSeed(db);
  await projectsSeed(db);
  await moreSeed(db);
}

module.exports = { seed, staticSeed, usersSeed, projectsSeed, moreSeed };
