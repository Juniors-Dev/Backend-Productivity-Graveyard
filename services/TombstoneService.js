class TombstoneService {
  constructor(db) {
    this.db = db.sequelize;
    this.Tombstone = db.Tombstone;
  }

  async getAll() {
    return this.Tombstone.findAll();
  }
}

module.exports = TombstoneService;
