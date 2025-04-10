var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cors = require("cors");
const logger = require("morgan");

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

var { indexRouter, usersRouter, projectsRouter, authRouter } = require("./routes/index");

var { db } = require("./models");

// Check if the database connection is successful
db.sequelize
  .authenticate()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => {
    console.error("❌ Unable to connect to the database:", err);
    process.exit(1); // stop app from starting
  });

// can add the seeder here if needed
db.sequelize.sync({ force: false }).then(async () => {});

var app = express();

// Enable CORS if needed
if (process.env.CORS === "true") {
  app.use(cors());
}

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/projects", projectsRouter);

// Swagger
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler, will catch errors passed by the async handler on controllers/middlewares
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    status: "error",
    statusCode: err.status || 500,
    data: {
      result: err.message || "Internal Server Error",
      error: err,
    },
  });
});

module.exports = app;
