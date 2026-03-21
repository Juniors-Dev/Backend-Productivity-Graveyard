const { Op } = require("sequelize");
const sanitizeUser = require("../utilities/sanitizeUser");
const ProjectService = require("./ProjectService.js");
const StatsService = require("./StatsService.js");

class UserService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
    this.Role = db.Role;
    this.projectService = new ProjectService(db);
    this.statsService = new StatsService(db);
  }

  async getAll() {
    return this.User.findAll({
      include: [{ model: this.Role }],
      attributes: { exclude: ["hashedPassword", "salt", "roleId"] },
    });
  }

  async getOneEmail(email, exclude = true, paranoid = true) {
    return this.User.findOne({
      where: { email },
      include: [{ model: this.Role }],
      attributes: {
        exclude: exclude ? ["hashedPassword", "salt", "roleId"] : [],
      },
      paranoid, // if paranoid is false, deletedAt will be null
    });
  }

  async getOneUsername(username) {
    return this.User.findOne({
      where: { username },
      include: [{ model: this.Role }],
      attributes: { exclude: ["hashedPassword", "salt", "roleId"] },
    });
  }

  async getOneId(userId) {
    const user = await this.User.findOne({
      where: { id: userId },
      include: [{ model: this.Role }],
      attributes: { exclude: ["hashedPassword", "salt", "roleId"] },
    });

    if (!user) return null;
    return sanitizeUser(user);
  }

  async getProfile(userId, options = {}) {
    const { currentUserId = null, ...sanitizeOptions } = options;

    const user = await this.User.findOne({
      where: { id: userId },
      include: [{ model: this.Role }],
      attributes: { exclude: ["hashedPassword", "salt", "roleId"] },
    });

    if (!user) return null;

    const sanitizedUser = sanitizeUser(user, sanitizeOptions);
    const { count, rows } = await this.projectService.getAll(10, 0, {
      userId,
      currentUserId,
    });

    const stats = await this.statsService.getUserStats(userId);

    sanitizedUser.projects = {
      data: rows,
      meta: {
        total: count,
        limit: 10,
        offset: 0,
        hasNext: count > 10 + 0,
      },
    };
    sanitizedUser.stats = stats;

    return sanitizedUser;
  }

  async create({ firstName, lastName, username, email, hashedPassword, salt, roleId }) {
    return this.User.create({
      firstName,
      lastName,
      username,
      email,
      hashedPassword,
      salt,
      roleId: roleId,
    });
  }

  async update(id, args) {
    const updated = await this.User.update(
      { ...args },
      {
        where: { id },
      }
    );

    const updatedUser = await this.getOneId(id);
    return updatedUser;
  }

  async softDelete(id) {
    const user = await this.User.findByPk(id, {
      include: [{ model: this.Role }],
    });

    if (!user) {
      return null;
    }

    let transaction;
    try {
      transaction = await this.client.transaction();
      await user.destroy({ transaction });
      await transaction.commit();

      return true;
    } catch (error) {
      if (transaction) await transaction.rollback();
      throw error;
    }
  }

  /*async getAllDeleted(options = {}) {
    const users = await this.User.findAll({
      where: {
        deletedAt: {
          [Op.ne]: null,
        },
      },
      paranoid: false,
    });

    return users.map((user) => sanitizeUser(user, options));
  }

  async restore(id) {
    return this.User.restore({ where: { id } });
  }*/
}

module.exports = UserService;
