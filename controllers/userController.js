const { UserService } = require("../services/index");
const { db } = require("../models");
const userService = new UserService(db);
const { createError, successResponse } = require("../utilities");

//This for getting the user based of Id.
async function getUser(req, res, next) {
  const id = req.params.id;
  const user = await userService.getProfile(id);

  if (!user) {
    throw createError({
      statusCode: 404,
      message: "User not found",
    });
  }

  res.status(200).json(
    successResponse({
      message: "User retrieved successfully.",
      data: user,
      statusCode: 200,
    })
  );
}

async function getMe(req, res, next) {
  const id = req.user.id;
  const user = await userService.getProfile(id, { isOwner: true });

  if (!user) {
    throw createError({
      statusCode: 404,
      message: "Failed to retrive user",
    });
  }

  res.status(200).json(
    successResponse({
      message: "Current user retrieved successfully.",
      data: user,
      statusCode: 200,
    })
  );
}

async function updateMe(req, res, next) {
  const id = req.user.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    throw createError({
      statusCode: 400,
      message: "At least one field must be provided for update",
    });
  }

  const updatedUser = await userService.update(id, req.body);

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      message: "User not found",
    });
  }

  res.status(200).json(
    successResponse({
      message: "User profile updated successfully.",
      data: updatedUser,
      statusCode: 200,
    })
  );
}

async function softDeletedUser(req, res, next) {
  const id = req.user.id;
  const deletedUser = await userService.softDelete(id);

  if (!deletedUser) {
    throw createError({
      statusCode: 404,
      message: "User not found",
    });
  }

  res.status(200).json(
    successResponse({
      message: "User successfully deleted.",
      data: null,
      statusCode: 200,
    })
  );
}

// This should be added to a AdminController
/*async function getAllSoftDeleted(req, res, next) {
  const deletedUsers = await userService.getAllDeleted({ isAdmin: true });

  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: deletedUsers,
  });
}*/

module.exports = { getUser, updateMe, getMe, softDeletedUser };
