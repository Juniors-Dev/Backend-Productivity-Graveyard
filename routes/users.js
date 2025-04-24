var express = require("express");
var router = express.Router();
const { getUser, updateMe, getMe, softDeletedUser, getAllSoftDeleted } = require("../controllers/userController");
const { authenticate, hasRole, isAdmin, isSelfOrAdmin } = require("../middleware/authentication");
const asyncHandler = require("../middleware/asyncHandler");

router.get("/", function (req, res, next) {
  res.status(200).json({ message: "Welcome to the API" });
});

//GET USER/ME
router.get("/me", asyncHandler(authenticate), asyncHandler(getMe));

//this should be added to the AdminController
router.get("/deleted", asyncHandler(authenticate), asyncHandler(getAllSoftDeleted));

//GET USER/ID
router.get("/:id", asyncHandler(getUser));

//Update user info.
router.put("/me", asyncHandler(authenticate), asyncHandler(updateMe));

router.delete("/me", asyncHandler(authenticate), asyncHandler(softDeletedUser));

module.exports = router;
