var express = require("express");
var router = express.Router();
var {
  getAll,
  getOneId,
  create,
  update,
  deleteProject,
  addType,
  removeType,
} = require("../controllers/projectController");
var asyncHandler = require("../middlewares/asyncHandler");

router.get("/", asyncHandler(getAll));

router.get("/:id", asyncHandler(getOneId));

router.post("/", asyncHandler(create));

router.put("/:id", asyncHandler(update));

router.delete("/:id", asyncHandler(deleteProject));

router.post("/:id/type", asyncHandler(addType));

router.delete("/:id/type", asyncHandler(removeType));

module.exports = router;
