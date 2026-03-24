const express = require("express");
const router = express.Router();
const { db } = require("../models");

router.get("/", function (req, res, next) {
  res.status(200).json({ message: "Welcome to the API" });
});

router.get("/healthz", async (req, res) => {
  try {
    await db.sequelize.query("SELECT 1;");

    // Check counts of essential tables
    const [roleCount, typeCount, achievementCount] = await Promise.all([
      db.Role.count(),
      db.Type.count(),
      db.Achievement.count(),
    ]);

    if (roleCount === 0 || typeCount === 0 || achievementCount === 0) {
      return res.status(500).json({
        status: "incomplete seed",
        roleCount,
        typeCount,
        achievementCount,
      });
    }

    const seconds = Math.floor(process.uptime());
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const friendlyUptime = `${hours}h ${minutes % 60}m ${seconds % 60}s`;

    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      friendlyUptime,
      roleCount,
      typeCount,
      achievementCount,
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ status: "db unavailable", error: "An internal server error occurred" });
  }
});

module.exports = router;
