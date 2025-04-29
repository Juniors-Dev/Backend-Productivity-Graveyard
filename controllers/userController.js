const { UserService, ProjectServices } = require("../services/index");
const { db } = require("../models");
const userService = new UserService(db);
const projectServices = new ProjectServices(db);
const sanitizeUser = require("../utilities/sanitizeUser");

//This for getting the user based of Id.
async function getUser(req, res, next) {
  const id = req.params.id;
  const user = await userService.getOneId(id);

  if (!user) {
    throw new Error("User not found");
  }

  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: user,
  });
}

async function getMe(req, res, next) {
  const id = req.user.id;
  const user = await userService.getOneId(id);

  if (!user) {
    throw new Error("Failed to retrive user");
  }

  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: user,
  });
}

async function updateMe(req, res, next) {
  const id = req.user.id;

  const user = await userService.getOneId(id);
  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await userService.update(id, req.body);

  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: sanitizeUser(user),
  });
}

async function softDeletedUser(req, res, next) {
  try {
    const id = req.user.id;

    const deletedUser = await userService.softDelete(id);

    if (!deletedUser) {
      throw new Error("User not found");
    }

    res.status(200).json({
      status: "success",
      statusCode: 200,
      data: deletedUser,
    });
  } catch (error) {
    next(error);
  }
}

//this should be added to the AdminController
async function getAllSoftDeleted(req, res, next) {
  const deletedUsers = await userService.getAllDeleted();

  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: deletedUsers,
  });
}

module.exports = { getUser, updateMe, getMe, softDeletedUser, getAllSoftDeleted };
