const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getFrom = () => `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`;

async function sendVerificationEmail(to, token) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

  const info = await transporter.sendMail({
    from: getFrom(),
    to,
    subject: "Confirm your email address",
    html: `
      <h2>Welcome to Productivity Graveyard!</h2>
      <p>Please confirm your email address by clicking the link below:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link is valid for 24 hours.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    `,
  });

  if (process.env.ENVIRONMENT === "development") {
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}

async function sendPasswordResetEmail(to, token) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  const info = await transporter.sendMail({
    from: getFrom(),
    to,
    subject: "Reset your password",
    html: `
      <h2>Forgot your password?</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link is valid for 30 minutes and can only be used once.</p>
      <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
    `,
  });

  if (process.env.ENVIRONMENT === "development") {
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
