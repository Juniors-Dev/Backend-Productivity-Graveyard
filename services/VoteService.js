var { createError } = require("../utilities");
class VoteService {
  constructor(db) {
    this.client = db.sequelize;
    this.Upvote = db.Upvote;
    this.Project = db.Project;
  }

  async toggleUpvote(userId, projectId) {
    const result = await this.client.transaction(async (t) => {
      const existingUpvote = await this.Upvote.findOne({
        where: { userId, projectId },
        transaction: t,
      });

      let voted;
      if (existingUpvote) {
        await existingUpvote.destroy({ transaction: t });
        voted = false;
      } else {
        const project = await this.Project.findByPk(projectId, {
          attributes: ["id"],
          transaction: t,
        });
        if (!project) {
          throw createError({
            message: "Project not found",
            status: "not found",
            statusCode: 404,
          });
        }
        await this.Upvote.create({ userId, projectId }, { transaction: t });
        voted = true;
      }

      const count = await this.Upvote.count({
        where: { projectId },
        transaction: t,
      });

      return { voted, count };
    });
    return result;
  }
}

module.exports = VoteService;
