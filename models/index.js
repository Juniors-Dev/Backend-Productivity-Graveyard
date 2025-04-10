const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const basename = path.basename(__filename);
const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD, {
  host: process.env.HOST,
  dialect: process.env.DIALECT,
  dialectOptions: { decimalNumbers: true },
});

function createDatabase(options) {
  const db = {};
  db.sequelize = options;
  fs.readdirSync(__dirname)
    .filter((file) => {
      return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
    })
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(options, Sequelize);
      db[model.name] = model;
    });
  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  return db;
}

const db = createDatabase(sequelize);
module.exports = { db, createDatabase };
