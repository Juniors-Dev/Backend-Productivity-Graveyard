const express = require("express");
const router = express.Router();
const { db } = require("../models");
const { successResponse, createError } = require("../utilities");
const { asyncHandler } = require("../middleware");

router.get("/", function (req, res, next) {
  res.status(200).json(successResponse({ message: "Welcome to the API", statusCode: 200 }));
});

router.get(
  "/healthz",
  asyncHandler(async (req, res) => {
    await db.sequelize.query("SELECT 1;");

    const counts = await Promise.all([db.Role.count(), db.Type.count(), db.Achievement.count()]);
    const isSeeded = counts.every((count) => count > 0);

    if (!isSeeded) {
      throw createError({ statusCode: 500, message: "Service unavailable" });
    }

    const seconds = Math.floor(process.uptime());
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const friendlyUptime = `${hours}h ${minutes % 60}m ${seconds % 60}s`;

    res.status(200).json(
      successResponse({
        message: "OK",
        statusCode: 200,
        data: { uptime: seconds, friendlyUptime },
      })
    );
  })
);

module.exports = router;
