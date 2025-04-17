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
var { authenticate, hasRole, validateSchema } = require("../middleware");

router.get("/", asyncHandler(getAll));

router.get("/types", asyncHandler(getAllTypes));

router.get("/:id", asyncHandler(getOneId));

router.post("/", authenticate, asyncHandler(hasRole("user")), asyncHandler(create));

router.put("/:id", authenticate, asyncHandler(hasRole("user")), asyncHandler(update));

router.delete("/:id", authenticate, asyncHandler(hasRole("user")), asyncHandler(deleteProject));

router.put("/:id/type", authenticate, asyncHandler(hasRole("user")), asyncHandler(addType));

router.delete("/:id/type", authenticate, asyncHandler(hasRole("user")), asyncHandler(removeType));

module.exports = router;
