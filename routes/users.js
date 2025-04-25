var express = require("express");
var router = express.Router();
const {
  getUser,
  updateMe,
  getMe,
  softDeletedUser,
  getAllSoftDeleted,
  requestPasswordReset,
  resetPassword,
  requestEmailReset,
  resetEmail,
} = require("../controllers/userController");

const { authenticate, asyncHandler, passwordResetLimiter, emailResetLimiter } = require("../middleware");

router.get("/", function (req, res, next) {
  res.status(200).json({ message: "Welcome to the API" });
});

// GET USER/ME
router.get("/me", asyncHandler(authenticate), asyncHandler(getMe));
router.put("/me", asyncHandler(authenticate), asyncHandler(updateMe));
router.delete("/me", asyncHandler(authenticate), asyncHandler(softDeletedUser));

// ADMIN
router.get("/deleted", asyncHandler(authenticate), asyncHandler(getAllSoftDeleted));

// Email flows
router.post("/request-email-reset", asyncHandler(authenticate), emailResetLimiter, asyncHandler(requestEmailReset));

router.post("/verify-new-email", asyncHandler(resetEmail));

router.post("/request-password-reset", passwordResetLimiter, asyncHandler(requestPasswordReset));

router.post("/reset-password", asyncHandler(resetPassword));

// Dynamic route
router.get("/:id", asyncHandler(getUser));

module.exports = router;
