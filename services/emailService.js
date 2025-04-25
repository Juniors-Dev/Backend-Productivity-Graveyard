const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email verification link to user
 * @param {string} to - recipient email address
 * @param {string} token - email verification token
 */
async function sendVerificationEmail(to, token) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to,
    subject: "Confirm your email address",
    html: `
        <h2>Welcome to Productivity Graveyard!</h2>
        <p>Please confirm your email address by clicking the link below:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link is valid for 24 hours.</p>
      `,
  });
}

async function sendPasswordResetEmail(to, token) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/users/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to,
    subject: "Reset your password",
    html: `
      <h2>Forgot your password?</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link is valid for 30 minutes.</p>
    `,
  });
}

async function sendEmailChangeVerification(to, token) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/users/verify-new-email?token=${token}`;

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to,
    subject: "Confirm your new email address",
    html: `
      <h2>Confirm your new email address</h2>
      <p>Please click the link below to confirm your new email address:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link is valid for 30 minutes.</p>
    `,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeVerification,
};
