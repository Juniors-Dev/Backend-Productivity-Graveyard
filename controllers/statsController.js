const { db } = require("../models");
const { StatsService } = require("../services");
const statsService = new StatsService(db);
const { successResponse, createError, mapGlobalStats, mapUserStats } = require("../utilities");

async function getAll(req, res) {
  const data = await statsService.getAll();

  res.status(200).json(
    successResponse({
      message: "Success",
      data: mapGlobalStats(data),
      statusCode: 200,
    })
  );
}

async function getUserStats(req, res) {
  const userId = req.params.id || null;
  if (!userId) {
    throw createError({
      status: "bad_request",
      statusCode: 400,
      message: "Bad Request, user ID is required.",
    });
  }

  const data = await statsService.getUserStats(userId);

  res.status(200).json(
    successResponse({
      message: "Success",
      data: mapUserStats(data),
      statusCode: 200,
    })
  );
}

async function getCurrentUserStats(req, res) {
  const userId = req.user?.id || null;
  if (!userId) {
    throw createError({
      status: "unauthorized",
      statusCode: 401,
      message: "Unauthorized, user not found.",
    });
  }

  const data = await statsService.getUserStats(userId);

  res.status(200).json(
    successResponse({
      message: "Success",
      data: mapUserStats(data),
      statusCode: 200,
    })
  );
}

module.exports = {
  getAll,
  getUserStats,
  getCurrentUserStats,
};
