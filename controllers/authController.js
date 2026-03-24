const { db } = require("../models");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/emailService");
const { UserService, RoleService, AuthService } = require("../services/index");
const userService = new UserService(db);
const authService = new AuthService(db);
const roleService = new RoleService(db);

const { generateToken: generateJwt } = require("../utilities/jwt");
const { hashPassword, verifyPassword } = require("../utilities/hashing");
const { createError, successResponse } = require("../utilities");

async function register(req, res) {
  const { firstName, lastName, username, email, password } = req.body;
  const { salt, hashedPassword } = await hashPassword(password);

  const role = await roleService.getOneRole("user");

  const user = await userService.create({
    firstName,
    lastName,
    username,
    email,
    hashedPassword,
    salt,
    roleId: role.id,
  });

  try {
    const verificationToken = await authService.createVerificationToken(user.id);
    await sendVerificationEmail(email, verificationToken);
  } catch (error) {
    // SMTP failure. User can resend via /auth/resend-verification
  }

  res.status(201).json(
    successResponse({
      message: "Account created successfully. Please check your email to verify your account.",
      statusCode: 201,
    })
  );
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await userService.getOneEmail(email, false);

  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Invalid email or password, please try again.",
    });
  }

  const verifyUser = await verifyPassword(password, user.salt, user.hashedPassword);

  if (!verifyUser) {
    throw createError({
      statusCode: 401,
      message: "Invalid email or password, please try again.",
    });
  }

  const token = generateJwt({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.Role.name,
  });

  res.status(200).json(
    successResponse({
      message: "Login successful.",
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.Role.name,
        isEmailVerified: user.isEmailVerified,
        token,
      },
      statusCode: 200,
    })
  );
}

async function verifyEmail(req, res) {
  const { token } = req.body;
  await authService.verifyEmail(token);

  res.status(200).json(
    successResponse({
      message: "Email verified successfully.",
      statusCode: 200,
    })
  );
}

async function resendVerification(req, res) {
  const { email } = req.body;

  const user = await userService.getOneEmail(email);
  if (user && !user.isEmailVerified) {
    try {
      const token = await authService.createVerificationToken(user.id);
      await sendVerificationEmail(email, token);
    } catch (error) {
      if (error.statusCode === 429) throw error;
    }
  }

  res.status(200).json(
    successResponse({
      message: "If an account exists with that email and is unverified, a verification link has been sent.",
      statusCode: 200,
    })
  );
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  const user = await userService.getOneEmail(email);
  if (user) {
    try {
      const token = await authService.createPasswordResetToken(user.id);
      await sendPasswordResetEmail(email, token);
    } catch (error) {
      if (error.statusCode === 429) throw error;
    }
  }

  res.status(200).json(
    successResponse({
      message: "If an account exists with that email, we've sent a password reset link.",
      statusCode: 200,
    })
  );
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);

  res.status(200).json(
    successResponse({
      message: "Password reset successfully.",
      statusCode: 200,
    })
  );
}

module.exports = { register, login, verifyEmail, resendVerification, forgotPassword, resetPassword };
