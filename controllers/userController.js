const { db } = require("../models");
const { UserService, AuthService } = require("../services/index");
const userService = new UserService(db);
const authService = new AuthService(db);
const { createError, successResponse } = require("../utilities");

async function getUser(req, res) {
  const id = req.params.id;
  const user = await userService.getProfile(id, { currentUserId: req.user?.id ?? null });

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

async function getMe(req, res) {
  const id = req.user.id;
  const user = await userService.getProfile(id, { isOwner: true, currentUserId: req.user.id });

  if (!user) {
    throw createError({
      statusCode: 404,
      message: "User not found",
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

async function updateMe(req, res) {
  const id = req.user.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    throw createError({
      statusCode: 400,
      message: "At least one field must be provided for update",
    });
  }

  const updatedUser = await userService.update(id, req.body, { isOwner: true });

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

async function changePassword(req, res) {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(userId, currentPassword, newPassword);

  res.status(200).json(
    successResponse({
      message: "Password updated successfully.",
      statusCode: 200,
    })
  );
}

async function softDeletedUser(req, res) {
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

module.exports = { getUser, updateMe, getMe, softDeletedUser, changePassword };
