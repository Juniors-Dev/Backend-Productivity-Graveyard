var express = require("express");
var router = express.Router();
var { getAll, getUserStats, getCurrentUserStats } = require("../controllers/statsController");
var { authenticate, hasRole, validateSchema, ownsEntity, isLoggedIn, asyncHandler } = require("../middleware");

router.get("/", asyncHandler(getAll));

router.get("/user/me", authenticate, asyncHandler(getCurrentUserStats));

router.get("/user/:id", asyncHandler(getUserStats));

module.exports = router;
