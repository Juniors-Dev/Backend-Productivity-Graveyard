var express = require("express");
var router = express.Router();
var {
  getAll,
  getOneId,
  create,
  update,
  deleteProject,
  getAllTypes,
  addType,
  removeType,
} = require("../controllers/projectController");
var asyncHandler = require("../middleware/asyncHandler");
var { authenticate, hasRole, validateSchema, ownsEntity } = require("../middleware");
var { ProjectService } = require("../services");
var { db } = require("../models");
var projectService = new ProjectService(db);

router.get("/", asyncHandler(getAll));

router.get("/types", asyncHandler(getAllTypes));

router.get("/:id", asyncHandler(getOneId));

router.post("/", authenticate, asyncHandler(hasRole("user")), asyncHandler(create));

router.put(
  "/:id",
  authenticate,
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(update)
);

router.delete(
  "/:id",
  authenticate,
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(deleteProject)
);

router.put(
  "/:id/type",
  authenticate,
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(addType)
);

router.delete(
  "/:id/type",
  authenticate,
  asyncHandler(hasRole("user")),
  asyncHandler(ownsEntity(projectService)),
  asyncHandler(removeType)
);

module.exports = router;
