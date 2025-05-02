class ProjectQueryBuilder {
  constructor() {
    this.includeVotes = false;
    this.includeTypes = false;
    this.includeUserInfo = false;
    this.filters = {};
    this.orderBy = { column: "createdAt", direction: "DESC" };
  }

  withVotes() {
    this.includeVotes = true;
    return this;
  }

  withTypes() {
    this.includeTypes = true;
    return this;
  }

  withUser() {
    this.includeUserInfo = true;
    return this;
  }

  filterByUser(userId) {
    this.filters.userId = userId;
    return this;
  }

  filterByStatus(status) {
    this.filters.status = status;
    return this;
  }

  filterByTypes(types) {
    this.filters.types = types;
    return this;
  }

  filterById(projectId) {
    this.filters.projectId = projectId;
    return this;
  }

  orderByField(column, direction = "DESC") {
    this.orderBy = { column, direction };
    return this;
  }

  buildSelectFields() {
    const fields = [
      `p."id"`,
      `p."name"`,
      `p."description"`,
      `p."createdAt"`,
      `p."updatedAt"`,
      `p."eulogy"`,
      `p."causeOfDeath"`,
      `p."tombstoneId"`,
      `p."startDate"`,
      `p."endDate"`,
      `p."status"`,
      `p."userId"`,
      `COUNT(DISTINCT c."id")::INT AS "commentCount"`,
    ];

    if (this.includeTypes) {
      fields.push(`ARRAY_AGG(jsonb_build_object('name', t."name", 'id', t."id")) AS "types"`);
      // fields.push(`ARRAY_AGG(DISTINCT t."name") AS "types"`);
      // fields.push(`ARRAY_AGG(rows(t."name", t."id")) AS "types"`);
    }

    if (this.includeVotes) {
      fields.push(`COUNT(DISTINCT uv."id")::INT AS "upvoteCount"`);
      fields.push(`BOOL_OR(uv."userId" = :currentUserId) AS "userHasVoted"`);
    }

    if (this.includeUserInfo) {
      fields.push(`  jsonb_build_object('id', u."id",'username', u."username",'avatarUrl', u."avatarUrl") AS user`);
      // fields.push(`u."username"`, `u."avatarUrl"`, `u."id" AS "userId"`);
    }

    return fields.join(",\n");
  }

  buildJoins() {
    const joins = [`LEFT JOIN "Comments" c ON p."id" = c."projectId"`];

    if (this.includeVotes) {
      joins.push(`LEFT JOIN "Upvotes" uv ON p."id" = uv."projectId"`);
    }

    if (this.includeTypes) {
      joins.push(`LEFT JOIN "ProjectTags" pt ON p."id" = pt."projectId"`);
      joins.push(`LEFT JOIN "Types" t ON pt."typeId" = t."id"`);
    }

    if (this.includeUserInfo) {
      joins.push(`LEFT JOIN "Users" u ON p."userId" = u."id"`);
    }

    return joins.join("\n");
  }

  buildWhereClause() {
    const conditions = [];

    if (this.filters.projectId) conditions.push(`p."id" = :projectId`);
    if (this.filters.userId) conditions.push(`p."userId" = :userId`);
    if (this.filters.status) conditions.push(`p."status" = :status`);
    if (this.filters.types?.length) conditions.push(`t."id" IN (:types)`);

    return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  }

  buildGroupBy() {
    const groups = [
      `p."id"`,
      `p."name"`,
      `p."description"`,
      `p."createdAt"`,
      `p."updatedAt"`,
      `p."eulogy"`,
      `p."causeOfDeath"`,
      `p."tombstoneId"`,
      `p."startDate"`,
      `p."endDate"`,
      `p."status"`,
    ];

    if (this.includeUserInfo) {
      groups.push(`u."username"`, `u."avatarUrl"`, `u."id"`);
    }

    return groups.join(",\n");
  }

  buildOrderBy() {
    return `ORDER BY p."${this.orderBy.column}" ${this.orderBy.direction}`;
  }

  buildListQuery() {
    return `
      SELECT
        ${this.buildSelectFields()}
      FROM "Projects" p
      ${this.buildJoins()}
      ${this.buildWhereClause()}
      GROUP BY ${this.buildGroupBy()}
      ${this.buildOrderBy()}
      LIMIT :limit OFFSET :offset
    `;
  }

  buildCountQuery() {
    return `
      SELECT COUNT(DISTINCT p."id") AS count
      FROM "Projects" p
      ${this.buildJoins()}
      ${this.buildWhereClause()}
    `;
  }
}

module.exports = ProjectQueryBuilder;
