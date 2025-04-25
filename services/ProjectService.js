class ProjectService {
  constructor(db) {
    this.client = db.sequelize;
    this.Project = db.Project;
    this.Type = db.Type;
    this.User = db.User;
  }

  async getAll(limit = 100, offset = 0, options = {}) {
    const { userId = null, currentUserId = null, status, orderBy, order, types = [] } = options;
    // return this.Project.findAndCountAll({
    //   where: {
    //     ...(orderBy === "createdAt" ? { createdAt: order } : {}),
    //     ...(userId ? { userId } : {}),
    //     ...(status ? { status } : {}),
    //     ...(types.length ? { "$types.id$": types } : {}),
    //   },
    //   include: [
    //     {
    //       model: this.Type,
    //       as: "types",
    //       through: { attributes: [id] },
    //       //required: !!types.length,
    //       // ...(types.length ? { where: { id: types } } : {}),
    //     },
    //     {
    //       model: this.User,
    //       attributes: ["id", "username", "avatarUrl"],
    //     },
    //   ],
    //   limit,
    //   offset,
    //   distinct: true,
    // });
    const projects = await this.client.query(
      `
      SELECT 
        p."id",
        p."name",
        p."description",
        p."createdAt",
        p."updatedAt",
        COUNT(DISTINCT uv."id") AS "upvoteCount",
        COUNT(uv."userId") FILTER (WHERE uv."userId" = :currentUserId) AS "userHasVoted",
        MAX(CASE WHEN uv."userId" = :currentUserId THEN 1 ELSE 0 END) > 0 AS "userHasVoted",
        u."username",
        u."avatarUrl",
        u."id" AS "userId"        
      FROM "Projects" p
      LEFT JOIN "Upvotes" uv ON p."id" = uv."projectId"
      LEFT JOIN "ProjectTags" pt ON p."id" = pt."projectId"
      LEFT JOIN "Types" t ON pt."typeId" = t."id"
      LEFT JOIN "Users" u ON p."userId" = u."id"
      GROUP BY p."id", p."name", p."description", p."createdAt", p."updatedAt", u."username", u."avatarUrl", u."id"
      ORDER BY p."createdAt" DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: {
          currentUserId,
          limit,
          offset,
        },
        type: this.client.QueryTypes.SELECT,
      }
    );

    const count = await this.client.query(
      `
      SELECT COUNT(*) AS count FROM "Projects" p
      LEFT JOIN "Upvotes" uv ON p."id" = uv."projectId"
      LEFT JOIN "ProjectTags" pt ON p."id" = pt."projectId"
      LEFT JOIN "Types" t ON pt."typeId" = t."id"
      LEFT JOIN "Users" u ON p."userId" = u."id"
      `,
      {
        type: this.client.QueryTypes.SELECT,
      }
    );

    return {
      count: parseInt(count[0].count),
      rows: projects.map((project) => ({
        ...project,
      })),
    };
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
          attributes: ["id", "username", "avatarUrl"],
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
          {
            model: this.User,
            attributes: ["id", "username", "avatarUrl"],
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
