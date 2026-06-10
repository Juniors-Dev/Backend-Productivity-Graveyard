const { initDb, closeDb } = require("./db-init");

async function run() {
  try {
    await initDb();
    await closeDb();
    console.log("Database initialization successful.");
    process.exit(0); // Success exit code
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1); // Error exit code
  }
}

run();
