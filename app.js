var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cors = require("cors");
const logger = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
var { errorResponse } = require("./utilities/response");
var { createRateLimiter, createSlowDown } = require("./utilities/responseLimiting");

//swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

// routers
var { indexRouter, usersRouter, projectsRouter, authRouter, votesRouter, commentsRouter } = require("./routes/index");

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

app.use(
  createRateLimiter({
    max: parseInt(process.env.RATE_LIMIT_MAX) || 600,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000, // 10 minutes
    message: "Too many requests, please try again later.",
  })
);

app.use(
  createSlowDown({
    delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER) || 240,
    delayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS) || 500,
    windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS) || 5 * 60 * 1000, // 5 minutes
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/projects", projectsRouter);
app.use("/comments", commentsRouter);
app.use("/votes", votesRouter);

// Swagger
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler, will catch errors passed by the async handler on controllers/middlewares
app.use((err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  const message = err.message || "Internal Server Error";
  const errors = err.errors || null;
  const response = errorResponse({
    message,
    status,
    statusCode,
    errors: errors,
  });
  res.status(statusCode).json(response);
});

module.exports = app;
