var { db } = require("../models");
var { StatsService } = require("../services");
var statsService = new StatsService(db);
var { successResponse, errorResponse, createError } = require("../utilities");
var { getLimitOffset } = require("../utilities/getPagination.js");

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
        mostCommonCauses: data.mostcommoncauses,
        funeralsToday: data.funeralstoday,
        totalVotes: data.totalvotes,
        votesToday: data.votestoday,
        averageEulogyLength: data.averageeulogylength,
        rageQuitRate: data.ragequitrate,
        topBurialDay: data.topburialday,
        topBurialMonth: data.topburialmonth,
      },
      statusCode: 200,
    })
  );
}

module.exports = {
  getAll,
};
