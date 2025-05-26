class StatsService {
  constructor(db) {
    this.client = db.sequelize;
    this.Project = db.Project;
    this.User = db.User;
    this.Vote = db.Vote;
    this.Type = db.Type;
    this.Comment = db.Comment;
    this.Tombstone = db.Tombstone;
  }

  async getAll() {
    const stats = await this.client.query(
      `
      SELECT
        (SELECT COUNT(*) FROM "Users") AS totalUsers,
        (SELECT COUNT(*) FROM "Comments") AS totalComments,
        (SELECT COUNT(*) FROM "Projects") AS totalProjects,
        (SELECT AVG("endDate"::date - "startDate"::date) FROM "Projects") AS averageLifespan, 
        (
          SELECT t."name"
          FROM "ProjectTypes" pt
          JOIN "Types" t ON t."id" = pt."typeId"
          GROUP BY pt."typeId", t."name"
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS mostCommonCauses,
        (SELECT COUNT(*) FROM "Projects" WHERE "createdAt"::date = CURRENT_DATE) AS funeralsToday,
        (SELECT COUNT(*) FROM "Upvotes") AS totalVotes,
        (SELECT COUNT(*) FROM "Upvotes" WHERE "createdAt"::date = CURRENT_DATE) AS votesToday,
        (SELECT AVG(LENGTH("eulogy")) FROM "Projects") AS averageEulogyLength,
        (
          SELECT COUNT(*) 
          FROM "Projects" 
          WHERE DATE_PART('day', "endDate" - "startDate") <= 1
        ) * 100.0 / NULLIF((SELECT COUNT(*) FROM "Projects"), 0) AS rageQuitRate,
        (
          SELECT TRIM(TO_CHAR("endDate", 'Day')) AS topBurialDay
          FROM "Projects"
          WHERE "endDate" IS NOT NULL
          GROUP BY topBurialDay
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS topBurialDay,
                 (
          SELECT TRIM(TO_CHAR("endDate", 'Month')) AS topBurialMonth
          FROM "Projects"
          WHERE "endDate" IS NOT NULL
          GROUP BY topBurialMonth
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS topBurialMonth
      `,
      {
        type: this.client.QueryTypes.SELECT,
      }
    );

    return stats[0];
  }

  async getUserStats(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const stats = await this.client.query(
      `
    SELECT
      (SELECT COUNT(*) FROM "Projects" WHERE "userId" = :userId) AS totalProjects,
      (SELECT COUNT(*) FROM "Comments" WHERE "userId" = :userId) AS totalComments,
      (SELECT COUNT(*) FROM "Upvotes" WHERE "userId" = :userId) AS totalVotes,
      (SELECT AVG(LENGTH("eulogy")) FROM "Projects" WHERE "userId" = :userId) AS averageEulogyLength,
      (SELECT AVG("endDate"::date - "startDate"::date) FROM "Projects" WHERE "userId" = :userId) AS averageLifespan,
      (
        SELECT t."name"
        FROM "ProjectTypes" pt
        JOIN "Types" t ON t."id" = pt."typeId"
        JOIN "Projects" p ON p."id" = pt."projectId"
        WHERE p."userId" = :userId
        GROUP BY pt."typeId", t."name"
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS mostCommonCause,
      (SELECT COUNT(*) FROM "Projects" WHERE "createdAt"::date = CURRENT_DATE AND "userId" = :userId) AS funeralsToday,
      (SELECT COUNT(*) FROM "Upvotes" WHERE "createdAt"::date = CURRENT_DATE AND "userId" = :userId) AS votesToday,
      (
        SELECT COUNT(*) 
        FROM "Projects" 
        WHERE DATE_PART('day', "endDate" - "startDate") <= 1 AND "userId" = :userId
      ) * 100.0 / NULLIF((SELECT COUNT(*) FROM "Projects" WHERE "userId" = :userId), 0) AS rageQuitRate,
      (
        SELECT TRIM(TO_CHAR("endDate", 'Day'))
        FROM "Projects"
        WHERE "endDate" IS NOT NULL AND "userId" = :userId
        GROUP BY 1
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS topBurialDay,
      (
        SELECT TRIM(TO_CHAR("endDate", 'Month'))
        FROM "Projects"
        WHERE "endDate" IS NOT NULL AND "userId" = :userId
        GROUP BY 1
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS topBurialMonth
    `,
      {
        replacements: { userId },
        type: this.client.QueryTypes.SELECT,
      }
    );

    return stats[0];
  }
}

module.exports = StatsService;
