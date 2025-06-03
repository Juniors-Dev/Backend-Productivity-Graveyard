const { UserService } = require("../services/index");
const { db } = require("../models");
const userService = new UserService(db);
const sanitizeUser = require("../utilities/sanitizeUser");
const { hashPassword } = require("../utilities/hashing");

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
      message: "User successfully deleted",
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

async function requestPasswordReset(req, res, next) {
  const { email } = req.body;

  if (!email) {
    throw new Error("Email is required");
  }

  await userService.requestPasswordReset(email);

  return res.status(200).json({
    status: "success",
    statusCode: 200,
    data: {
      message: "If this email exists, a password reset link has been sent.",
    },
  });
}

async function resetPassword(req, res, next) {
  const token = req.query.token;
  const { password } = req.body;

  if (!token || !password) {
    throw new Error("Token and password are required");
  }

  const { hashedPassword, salt } = await hashPassword(password);

  await userService.resetPassword(token, hashedPassword, salt);

  res.status(200).json({
    status: "success",
    statusCode: 200,
    message: "Password has been reset successfully",
  });
}

async function resetEmail(req, res, next) {
  const token = req.query.token;

  if (!token) {
    throw new Error("Token is required");
  }

  await userService.resetEmail(token);

  res.status(200).json({
    status: "success",
    statusCode: 200,
    message: "Email has been reset successfully",
  });
}

async function requestEmailReset(req, res, next) {
  const { email } = req.body;

  if (!email) {
    throw new Error("Email is required");
  }

  await userService.requestEmailChange(req.user.id, email);

  return res.status(200).json({
    status: "success",
    statusCode: 200,
    data: {
      message: "If this email exists, a verification link has been sent to the new email address.",
    },
  });
}

module.exports = {
  getUser,
  updateMe,
  getMe,
  softDeletedUser,
  getAllSoftDeleted,
  requestPasswordReset,
  resetPassword,
  requestEmailReset,
  resetEmail,
};
