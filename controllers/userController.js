const { UserService, ProjectServices } = require("../services/index");
const { db } = require("../models");
const userService = new UserService(db);
const projectServices = new ProjectServices(db);

//This for getting the user based of Id.
async function getUser(req, res, next) {
  const id = req.params.id;
  const user = await userService.getOneId(id);

  if (!user) {
    throw new Error("Failed to retrive user");
  }

  res.status(200).json(user);
}

async function getMe(req, res, next) {
  const id = req.user.id;
  console.log("req.user:", req.user);
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
  try {
    const id = req.user.id;

    const user = await userService.getOneId(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await userService.update(id, req.body);

    res.status(200).json({
      status: "success",
      statusCode: 200,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

async function softDeletedUser(req, res, next) {
  try {
    const id = req.user.id;

    const deletedUser = await userService.softDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        status: "fail",
        statusCode: 404,
        message: "User not found or already deleted.",
      });
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
  try {
    const deletedUsers = await userService.getAllDeleted();

    res.status(200).json({
      status: "success",
      statusCode: 200,
      data: deletedUsers,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getUser, updateMe, getMe, softDeletedUser, getAllSoftDeleted };
