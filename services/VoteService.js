class VoteService {
  constructor(db) {
    this.client = db.sequelize;
    this.Upvote = db.Upvote;
    this.Project = db.Project;
  }

  /**
   * Helper method. Ensures a project with the given ID exists.
   * @param {string} projectId - UUID of the project to check.
   */
  async _ensureProjectExists(projectId) {
    const project = await this.Project.findByPk(projectId, { attributes: ["id"] });
    if (!project) {
      const err = new Error("Project not found");
      err.status = 404;
      throw err;
    }
  }

  /**
   * Gets the user's upvote status and total count for a project.
   * @param {string} userId - UUID of the user.
   * @param {string} projectId - UUID of the project.
   * @returns {Promise<{voted: boolean, count: number}>}
   */
  async getUserUpvoteStatus(userId, projectId) {
    await this._ensureProjectExists(projectId);

    // Fetch user's vote status and total count concurrently
    const [upvote, count] = await Promise.all([
      this.Upvote.findOne({ where: { userId, projectId } }),
      this.Upvote.count({ where: { projectId } }),
    ]);

    return {
      voted: !!upvote,
      count,
    };
  }

  /**
   * Toggles (add/remove) the user's upvote on a project.
   * @param {string} userId - UUID of the user toggling the upvote.
   * @param {string} projectId - UUID of the project.
   * @returns {Promise<{voted: boolean, count: number}>}
   */
  async toggleUpvote(userId, projectId) {
    await this._ensureProjectExists(projectId);
    // Transaction Time !!!
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
