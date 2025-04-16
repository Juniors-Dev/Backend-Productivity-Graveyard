var { db } = require("../models");
var userRoles = require("./roles.json");
var deathTypes = require("./types.json");

async function seed() {
  let transaction;
  try {
    const hasRoles = await db.Role.findAll();
    const hasTypes = await db.Type.findAll();
    if (hasRoles.length > 0 || hasTypes.length > 0) {
      console.log("Database already seeded. Skipping seeding process.");
      return;
    }
    transaction = await db.sequelize.transaction();

    const [roles, types] = await Promise.all([
      db.Role.bulkCreate(userRoles, { transaction }),
      db.Type.bulkCreate(deathTypes, { transaction }),
    ]);

    if (!roles || !types) {
      throw new Error("Failed to seed roles or types.");
    }

    console.log(roles, types);
    await transaction.commit();
    console.log("Roles seeded successfully.");
  } catch (error) {
    console.error("Error seeding roles:", error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
  }
}

module.exports = seed;
