// Example of a controller for user-related operations gut it and replace it with your own code

var { db } = require("../models");
var UserService = require("../services/UserService");
var userService = new UserService(db);
var RoleService = require("../services/RoleService");
var roleService = new RoleService(db);
var OrderService = require("../services/OrderService");
var orderService = new OrderService(db);
var { hashPassword } = require("../utilities/hashing");

async function getAll(req, res) {
  const users = await userService.getAll();
  res.status(200).json({ status: "success", statusCode: 200, data: { result: "Success", data: users } });
}

async function getUser(req, res) {
  const user = await userService.getOneId(req.user.id);
  if (!user) {
    res.status(404).json({ status: "not found", statusCode: 404, data: { result: "User not found." } });
  }
  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: { result: "Success, user found", data: user },
  });
}

async function getOneId(req, res) {
  const user = await userService.getOneId(req.params.id);
  if (!user) {
    res.status(404).json({ status: "not found", statusCode: 404, data: { result: "User not found." } });
  }
  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: { result: "Success, user found", data: user },
  });
}

async function getOneEmail(req, res) {
  const user = await userService.getOneEmail(req.body.email);

  if (!user) {
    res.status(404).json({ status: "not found", statusCode: 404, data: { result: "User not found." } });
  }

  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: { result: "Success, user found", data: user },
  });
}

async function changeRole(req, res) {
  const userId = req.params.id;
  const roleId = req.body.id;
  const targetUser = await userService.getOneId(userId);
  if (!targetUser) {
    res.status(404).json({ status: "not found", statusCode: 404, data: { result: "User not found." } });
  }

  if (targetUser.username === "admin") {
    res.status(403).json({
      status: "forbidden",
      statusCode: 403,
      data: { result: "Forbidden, cannot change the primary admin's role." },
    });
    return;
  }

  const role = await roleService.getOneId(roleId);
  if (!role) {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      data: { result: "Failed to create user. Role not found." },
    });
  }

  const user = await userService.update(userId, { roleId: role.id });
  if (!user) {
    res.status(500).json({ status: "error", statusCode: 500, data: { result: "Failed to update user." } });
  }

  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: { result: `User role updated to ${role.role}.`, user },
  });
}

async function updateUserDetails(req, res) {
  const userId = Number(req.params.id);
  const currentUser = req.user;

  if (currentUser.id !== userId && currentUser.role !== "admin") {
    res.status(403).json({
      status: "forbidden",
      statusCode: 403,
      data: { result: "Forbidden, you cannot update another user." },
    });
    return;
  }

  const user = await userService.getOneId(userId);
  if (!user) {
    res.status(404).json({ status: "not found", statusCode: 404, data: { result: "User not found." } });
    return;
  }

  const details = req.body;
  if (user.username === "admin" && details.username !== "admin") {
    res.status(403).json({
      status: "forbidden",
      statusCode: 403,
      data: { result: "Forbidden, cannot change the primary admin's username." },
    });
    return;
  }

  const userDetails = {};
  if (details.firstname) userDetails.firstname = details.firstname;
  if (details.lastname) userDetails.lastname = details.lastname;
  if (details.username) {
    const existingUser = await userService.getOneUsername(details.username);
    if (existingUser && existingUser.id != userId) {
      res.status(400).json({
        status: "bad request",
        statusCode: 400,
        data: { result: "Username already exists." },
      });
      return;
    }
    userDetails.username = details.username;
  }
  if (details.email) {
    const existingUser = await userService.getOneEmail(details.email);
    if (existingUser && existingUser.id != userId) {
      res.status(400).json({
        status: "bad request",
        statusCode: 400,
        data: { result: "Email already exists." },
      });
      return;
    }
    userDetails.email = details.email;
  }
  if (details.address) userDetails.address = details.address;
  if (details.phone) userDetails.phone = details.phone;
  if (details.password) {
    const { hashedPassword, salt } = await hashPassword(details.password);
    userDetails.encryptedPassword = hashedPassword;
    userDetails.salt = salt;
  }

  const updatedUser = await userService.update(userId, userDetails);

  res.status(200).json({
    status: "success",
    statusCode: 200,
    data: { result: "User profile updated", user: updatedUser },
  });
}

async function deleteUser(req, res) {
  const userId = req.params.id;
  const currentUser = req.user;
  if (currentUser.id == userId && currentUser.role === "admin") {
    res.status(403).json({
      status: "forbidden",
      statusCode: 403,
      data: { result: "Forbidden, you cannot delete your own admin account." },
    });
    return;
  }

  if (currentUser.id !== userId && currentUser.role !== "admin") {
    res.status(403).json({
      status: "forbidden",
      statusCode: 403,
      data: { result: "Forbidden, you cannot delete another user." },
    });
    return;
  }

  const user = await userService.getOneId(userId);

  if (!user) {
    res.status(404).json({ status: "not found", statusCode: 404, data: { result: "User not found." } });
    return;
  }

  const orders = await orderService.getOrdersByUserId(userId);
  if (orders.length > 0) {
    res.status(403).json({
      status: "forbidden",
      statusCode: 403,
      data: { result: "Forbidden, user has orders." },
    });
    return;
  }

  await userService.delete(userId);

  res.status(200).json({ status: "success", statusCode: 200, data: { result: "User deleted." } });
}

module.exports = {
  getAll,
  getUser,
  getOneId,
  getOneEmail,
  changeRole,
  updateUserDetails,
  deleteUser,
};
