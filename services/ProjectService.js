class ProjectService {
  constructor(db) {
    this.client = db.sequelize;
    this.Project = db.Project;
    this.Type = db.Type;
    this.User = db.User;
  }

  async getAll() {
    return this.Project.findAll({
      include: [
        {
          model: this.Type,
          as: "types",
          through: { attributes: [] },
        },
        {
          model: this.User,
          attributes: ["id", "username", "avatarUrl"],
        },
      ],
    });
  }

  async getOneId(id) {
    const project = await this.Project.findByPk(id, {
      include: [
        {
          model: this.Type,
          as: "types",
          through: { attributes: [] },
        },
        {
          model: this.User,
          attributes: ["id", "username"],
        },
      ],
    });
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  }

  async create({
    name,
    description,
    eulogy,
    causeOfDeath,
    startDate,
    endDate,
    userId,
    types = [],
    tombstoneId = null,
    status = "buried",
  }) {
    let transaction;
    try {
      transaction = await this.client.transaction();
      const project = await this.Project.create(
        {
          name,
          description,
          eulogy,
          causeOfDeath,
          startDate,
          endDate,
          userId,
          tombstoneId,
          status,
        },
        { transaction }
      );
      await project.setTypes(types || [], { transaction });
      await transaction.commit();

      return await this.Project.findByPk(project.id, {
        include: [
          {
            model: this.Type,
            as: "types",
            through: { attributes: [] },
          },
        ],
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error starting transaction:", error);
      throw error;
    }
  }

  async update(id, args) {
    const updated = await this.Project.update(
      { ...args },
      {
        where: { id },
      }
    );
    return updated[0] === 1 ? this.getOneId(id) : null;
  }

  async removeType(id, typeId) {
    const project = await this.Project.findByPk(id);
    if (!project) {
      throw new Error("Project not found");
    }
    await project.removeType(typeId);
    return project;
  }

  async addType(id, typeId) {
    const project = await this.Project.findByPk(id);
    if (!project) {
      throw new Error("Project not found");
    }
    await project.addType(typeId);
    return project;
  }

  async delete(id) {
    return this.Project.destroy({ where: { id } });
  }
}

module.exports = ProjectService;
