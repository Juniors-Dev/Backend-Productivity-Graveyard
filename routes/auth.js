var express = require("express");
var router = express.Router();
var { login, register } = require("../controllers/authController");
var { validateSchema, asyncHandler, validateCredentials } = require("../middleware");
const { loginSchema, registerSchema, updateUserSchema } = require("../schema");

//Get Welcome
router.get("/", function (req, res, next) {
  res.status(200).json({ message: "Welcome to the API" });
});

//Regitser
router.post("/register", validateSchema(registerSchema), asyncHandler(validateCredentials), asyncHandler(register));
//Login
router.post("/login", validateSchema(loginSchema), asyncHandler(login));

module.exports = router;
