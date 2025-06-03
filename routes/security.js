const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authentication");
const { ipLimiter, emailLimiter, sensitiveEndpointsLimiter } = require("../middleware/rateLimiter");
const UserSecurityService = require("../services/UserSecurityService");
const { db } = require("../models");

const userSecurityService = new UserSecurityService(db);

// Email change routes
router.post("/change-email", [authenticate, ipLimiter, emailLimiter], async (req, res) => {
  try {
    const result = await userSecurityService.initiateEmailChange(req.user.id, req.body.newEmail);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      statusCode: 400,
      data: { result: error.message },
    });
  }
});

router.post("/confirm-email-change", [ipLimiter], async (req, res) => {
  try {
    const result = await userSecurityService.confirmEmailChange(req.body.token);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      statusCode: 400,
      data: { result: error.message },
    });
  }
});

// Password change route
router.post("/change-password", [authenticate, sensitiveEndpointsLimiter], async (req, res) => {
  try {
    const result = await userSecurityService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      statusCode: 400,
      data: { result: error.message },
    });
  }
});

module.exports = router;
