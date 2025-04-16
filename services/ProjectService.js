class ProjectService {
  constructor(db) {
    this.client = db.sequelize;
    this.Project = db.Project;
  }

  async getAll() {
    return this.Project.findAll();
  }

  async create({ name, description, startDate, endDate }) {
    return this.Project.create({
      name,
      description,
      startDate,
      endDate,
    });
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

  async delete(id) {
    return this.Project.destroy({ where: { id } });
  }
}

module.exports = ProjectService;
