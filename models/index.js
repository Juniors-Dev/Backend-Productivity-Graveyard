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
  const { CRUD_USERNAME, CRUD_PASSWORD, DATABASE_NAME } = process.env;

  // Use a single DO block to ensure all logic is executed as one unit
  const sql = `
    DO $$
    BEGIN
      -- Create User
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${CRUD_USERNAME}') THEN
        CREATE USER ${CRUD_USERNAME} WITH ENCRYPTED PASSWORD '${CRUD_PASSWORD}';
      END IF;

      -- Assign Privileges
      EXECUTE 'GRANT CONNECT ON DATABASE ${DATABASE_NAME} TO ${CRUD_USERNAME}';
      GRANT USAGE ON SCHEMA public TO ${CRUD_USERNAME};
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${CRUD_USERNAME};
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${CRUD_USERNAME};
      
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${CRUD_USERNAME};
    END
    $$;
  `;

  try {
    await sequelize.query(sql);
    console.log(`CRUD user setup complete.`);
  } catch (err) {
    console.error("Fatal DB setup error:", err);
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
