const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cors = require("cors");
const logger = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const { errorResponse } = require("./utilities/response");
const { createRateLimiter, createSlowDown } = require("./middleware");
const helmet = require("helmet");

//swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

// routers
const {
  indexRouter,
  usersRouter,
  projectsRouter,
  authRouter,
  votesRouter,
  commentsRouter,
  statsRouter,
} = require("./routes/index");

const { initDb } = require("./scripts/db-init");

// Setting up the database connection and ensuring the CRUD user has the necessary privileges
(async () => {
  try {
    if (process.env.NODE_ENV !== "test") {
      await initDb();
    }
  } catch (err) {
    console.error("Fatal DB setup error:", err);
    process.exit(1);
  }
})();

const app = express();

// Middlewarres for setting up the application

// TODO: Set trust proxy once deployment topology is known
// https://expressjs.com/en/guide/behind-proxies.html
//app.set("trust proxy", 1); // trust first proxy, adjust as needed for production

// Enable CORS if needed
if (process.env.CORS === "true") {
  app.use(cors());
}
// Security headers using Helmet
app.use(helmet());
// Disable the 'X-Powered-By' header for security
app.disable("x-powered-by");
app.use(logger("dev"));
// limit the size of JSON payloads to prevent abuse, we are not currently using file uploads this should be sufficient
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".webp")) {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      }
    },
  })
);

// Rate limiting and slow down middleware
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

// Route handlers
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/projects", projectsRouter);
app.use("/comments", commentsRouter);
app.use("/votes", votesRouter);
app.use("/stats", statsRouter);
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler, will catch errors passed by the async handler on controllers/middlewares
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  const message = err.message || "Internal Server Error";
  const errors = err.errors || null;
  if (statusCode >= 500 && process.env.LOG_ERRORS === "true") {
    console.error("Server Error:", err);
  }
  if (statusCode === 429 && err.retryAfter) {
    res.set("Retry-After", String(err.retryAfter));
  }
  const response = errorResponse({
    message,
    status,
    statusCode,
    errors: errors,
  });
  res.status(statusCode).json(response);
});

module.exports = app;
