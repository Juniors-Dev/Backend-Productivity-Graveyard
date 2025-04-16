var express = require("express");
var router = express.Router();
var { db } = require("../models");

router.get("/", function (req, res, next) {
  res.status(200).json({ message: "Welcome to the API" });
});

router.get("/check", async function (req, res, next) {
  try {
    const roles = await db.Role.findAll();
    const types = await db.Type.findAll();
    const users = await db.User.findAll();
    const projects = await db.Project.findAll();

    res.status(200).json({ status: "ok", roles, types, users, projects });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

module.exports = router;
