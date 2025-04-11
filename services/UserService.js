class UserService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
    this.Role = db.Role;
  }

  async getAll() {
    return this.User.findAll({
      include: [{ model: this.Role }],
      attributes: { exclude: ["encryptedPassword", "salt", "roleId"] },
    });
  }

  async getOneEmail(email, exclude = true) {
    return this.User.findOne({
      where: { email },
      include: [{ model: this.Role }],
      attributes: {
        exclude: exclude ? ["encryptedPassword", "salt", "roleId"] : [],
      },
    });
  }

  async getOneUsername(username) {
    return this.User.findOne({
      where: { username },
      include: [{ model: this.Role }],
      attributes: { exclude: ["encryptedPassword", "salt", "roleId"] },
    });
  }

  async getOneId(id) {
    return this.User.findOne({
      where: { id },
      include: [{ model: this.Role }],
      attributes: { exclude: ["encryptedPassword", "salt", "roleId"] },
    });
  }

  async create({ firstname, lastname, username, email, encryptedPassword, salt, roleId }) {
    return this.User.create({
      firstname,
      lastname,
      username,
      email,
      encryptedPassword,
      salt,
      address,
      phone,
      roleId,
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

  async delete(id) {
    return this.User.destroy({ where: { id } });
  }
}

module.exports = UserService;
