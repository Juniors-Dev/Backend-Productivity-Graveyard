class RoleService {
  constructor(db) {
    this.client = db.sequelize;
    this.Role = db.Role;
    this.User = db.User;
  }

  getAllRoles() {
    return this.Role.findAll();
  }
  getOneRole(rName) {
    return this.Role.findOne({
      where: {
        name: rname,
      },
    });
  }
}

module.exports = RoleService;
