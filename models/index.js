const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const basename = path.basename(__filename);

const config = {
  host: process.env.HOST,
  dialect: process.env.DIALECT,
  logging: false, // Disable logging for production
  dialectOptions: {
    decimalNumbers: true,
  },
};

if (process.env.SSL_REQUIRED === "true") {
  config.dialectOptions.ssl = {
    require: process.env.SSL_REQUIRED === "true" ? true : false,
    rejectUnauthorized: false,
  };
}

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.ADMIN_USERNAME,
  process.env.ADMIN_PASSWORD,
  config
);

const sequelizeCrudUser = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.CRUD_USERNAME,
  process.env.CRUD_PASSWORD,
  config
);

async function ensureCrudUserPrivileges() {
  const crudUser = process.env.CRUD_USERNAME;
  const crudPass = process.env.CRUD_PASSWORD;
  const dbName = process.env.DATABASE_NAME;

  const createUserAndGrant = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = '${crudUser}'
      ) THEN
        CREATE USER ${crudUser} WITH ENCRYPTED PASSWORD '${crudPass}';
      END IF;
    END
    $$;

    GRANT CONNECT ON DATABASE ${dbName} TO ${crudUser};
    GRANT USAGE ON SCHEMA public TO ${crudUser};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${crudUser};
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${crudUser};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${crudUser};
  `;

  try {
    await sequelize.query(createUserAndGrant);
    console.log(`CRUD user "${crudUser}" created and granted limited privileges.`);
  } catch (err) {
    console.error("Error creating CRUD user or assigning privileges:", err);
    throw err;
  }
}

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

const adminDb = createDatabase(sequelize);
const crudDb = createDatabase(sequelizeCrudUser);

module.exports = { db: crudDb, createDatabase, adminDb, ensureCrudUserPrivileges };
