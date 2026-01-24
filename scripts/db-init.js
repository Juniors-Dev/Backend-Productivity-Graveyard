// scripts/db-init.js
require("dotenv").config();

const { db, adminDb, ensureCrudUserPrivileges } = require("../models");
const seed = require("../seeder/seed"); // adjust path

async function initDb() {
  console.log("Beginning database initialization...");
  const force = process.env.FORCE_SYNC === "true";

  // Ensure admin DB connects and prepares schema + seeds
  await adminDb.sequelize.authenticate();
  await adminDb.sequelize.sync({ force });
  await seed(adminDb);

  // Create/grant crud user etc
  await ensureCrudUserPrivileges();

  // Verify crud connection works (optional but useful)
  await db.sequelize.authenticate();

  // Cleanup so CI doesn't hang on open handles
  await adminDb.sequelize.close();
  await db.sequelize.close();
}

module.exports = { initDb };
