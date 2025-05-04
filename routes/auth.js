var express = require("express");
var router = express.Router();
var { login, register } = require("../controllers/authController");
var { validateSchema, asyncHandler, validateCredentials } = require("../middleware");

//Get Welcome
router.get("/", function (req, res, next) {
  res.status(200).json({ message: "Welcome to the API" });
});

//Regitser
router.post("/register", asyncHandler(validateCredentials), asyncHandler(register));
//Login
router.post("/login", asyncHandler(login));

module.exports = router;
