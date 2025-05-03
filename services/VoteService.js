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
          const err = new Error("Project not found");
          err.status = 404;
          throw err;
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
