const { db } = require("../models");
const { StatsService } = require("../services");
const statsService = new StatsService(db);
const { successResponse, createError } = require("../utilities");

async function getAll(req, res) {
  const data = await statsService.getAll();
  res.status(200).json(
    successResponse({
      message: "Success",
      data: {
        totalUsers: data.totalusers,
        totalComments: data.totalcomments,
        totalProjects: data.totalprojects,
        averageLifespan: data.averagelifespan,
        mostCommonCause: data.mostcommoncause,
        funeralsToday: data.funeralstoday,
        totalVotes: data.totalvotes,
        votesToday: data.votestoday,
        averageEulogyLength: data.averageeulogylength,
        rageQuitRate: data.ragequitrate,
        topBurialDay: data.topburialday,
        topBurialMonth: data.topburialmonth,
        mostVotedProject: data.topvotedproject,
      },
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
      data: {
        totalUsers: data.totalusers,
        totalComments: data.totalcomments,
        totalProjects: data.totalprojects,
        averageLifespan: data.averagelifespan,
        mostCommonCause: data.mostcommoncause,
        funeralsToday: data.funeralstoday,
        totalVotes: data.totalvotes,
        votesToday: data.votestoday,
        averageEulogyLength: data.averageeulogylength,
        rageQuitRate: data.ragequitrate,
        topBurialDay: data.topburialday,
        topBurialMonth: data.topburialmonth,
        mostVotedProject: data.topvotedproject,
      },
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
      data: {
        totalUsers: data.totalusers,
        totalComments: data.totalcomments,
        totalProjects: data.totalprojects,
        averageLifespan: data.averagelifespan,
        mostCommonCause: data.mostcommoncause,
        funeralsToday: data.funeralstoday,
        totalVotes: data.totalvotes,
        votesToday: data.votestoday,
        averageEulogyLength: data.averageeulogylength,
        rageQuitRate: data.ragequitrate,
        topBurialDay: data.topburialday,
        topBurialMonth: data.topburialmonth,
        mostVotedProject: data.topvotedproject,
      },
      statusCode: 200,
    })
  );
}

module.exports = {
  getAll,
  getUserStats,
  getCurrentUserStats,
};
