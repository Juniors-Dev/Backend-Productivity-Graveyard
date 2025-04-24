var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cors = require("cors");
const logger = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
var { errorResponse } = require("./utilities/response");

//swagger
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

// routers
var { indexRouter, usersRouter, projectsRouter, authRouter } = require("./routes/index");

// database and seeder
var { db } = require("./models");
const seed = require("./seeder/seed.js");

// Check if the database connection is successful
db.sequelize.authenticate();

// can add the seeder here if needed
db.sequelize.sync({ force: false }).then(async () => {
  try {
    await seed();
  } catch (error) {
    console.error("Error seeding database:", error);
  }
});

var app = express();

// Enable CORS if needed
if (process.env.CORS === "true") {
  app.use(cors());
}

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
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

  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";
  const data = err.data || null;
  const response = errorResponse({
    message,
    statusCode,
    data,
  });
  res.status(statusCode).json(response);
});

module.exports = app;
