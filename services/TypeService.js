class TypeService {
  constructor(db) {
    this.db = db.sequelize;
    this.Type = db.Type;
  }

  async getAll() {
    return await this.Type.findAll();
  }
}

module.exports = TypeService;
