var express = require("express");
var router = express.Router();
var { getAll } = require("../controllers/statsController");
var asyncHandler = require("../middleware/asyncHandler");

router.get("/", asyncHandler(getAll));

module.exports = router;
