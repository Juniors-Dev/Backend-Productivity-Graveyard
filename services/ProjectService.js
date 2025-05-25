const ProjectQueryBuilder = require("./queries/ProjectQueryBuilder");
const createError = require("../utilities/createError");
class ProjectService {
  constructor(db) {
    this.client = db.sequelize;
    this.Project = db.Project;
    this.Type = db.Type;
    this.User = db.User;
  }

  async getAll(limit = 100, offset = 0, options = {}) {
    const { userId, currentUserId, status, orderBy, order, types, query } = options;
    const queryBuilder = new ProjectQueryBuilder()
      .withVotes()
      .withTypes()
      .withUser()
      .filterByUser(userId)
      .filterByStatus(status)
      .filterByTypes(types)
      .orderByField(orderBy || "createdAt", order || "DESC");
    if (query) {
      queryBuilder.queryByName(query);
    }

    const projects = await this.client.query(queryBuilder.buildListQuery(), {
      replacements: {
        currentUserId,
        limit,
        offset,
        userId,
        status,
        types,
        query: `%${query}%`,
      },
      type: this.client.QueryTypes.SELECT,
    });

    const count = await this.client.query(queryBuilder.buildCountQuery(), {
      replacements: {
        currentUserId,
        userId,
        status,
        types,
        query: `%${query}%`,
      },
      type: this.client.QueryTypes.SELECT,
    });
    return {
      count: parseInt(count[0].count),
      rows: projects,
    };
  }

  async getOneId(id, currentUserId = null) {
    const queryBuilder = new ProjectQueryBuilder().withVotes().withTypes().withUser().filterById(id);

    const project = await this.client.query(queryBuilder.buildListQuery(), {
      replacements: {
        projectId: id,
        currentUserId,
        limit: 1,
        offset: 0,
      },
      type: this.client.QueryTypes.SELECT,
    });

    // Since you’re expecting one, not many:
    if (project.length === 0) {
      throw createError({
        message: "Project not found",
        statusCode: 404,
      });
    }
    return project[0];
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
    tombstoneId = 1,
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
          {
            model: this.User,
            attributes: ["id", "username", "avatarUrl"],
          },
        ],
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error starting transaction:", error);
      throw createError({
        message: "Error creating project",
        status: "error",
        statusCode: 500,
        errors: { result: error.message },
      });
    }
  }

  async update(id, args) {
    const project = await this.Project.findByPk(id);
    if (!project) {
      throw createError({ message: "Project not found", statusCode: 404 });
    }

    const updated = await this.Project.update(
      { ...args },
      {
        where: { id },
      }
    );
    return this.getOneId(id);
  }

  async removeType(id, typeId) {
    const project = await this.Project.findByPk(id);
    if (!project) {
      throw createError({ message: "Project not found", statusCode: 404 });
    }
    await project.removeType(typeId);
    return this.getOneId(id);
  }

  async addType(id, typeId) {
    const project = await this.Project.findByPk(id);
    if (!project) {
      throw createError({ message: "Project not found", statusCode: 404 });
    }
    const type = await this.Type.findByPk(typeId);
    if (!type) {
      throw createError({ message: "Type not found", statusCode: 404 });
    }
    try {
      await project.addType(typeId);
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        console.error("Unique constraint error:", error);
        throw createError({
          message: "Type already exists in project",
          status: "error",
          statusCode: 409,
        });
      }
      throw createError({
        message: "Error adding type to project",
        status: "error",
        statusCode: 500,
        errors: { result: error.message },
      });
    }
    return this.getOneId(id);
  }

  async delete(id) {
    const project = await this.Project.findByPk(id);
    if (!project) {
      throw createError({ message: "Project not found", statusCode: 404 });
    }
    return this.Project.destroy({ where: { id } });
  }
}

module.exports = ProjectService;
