const { generateToken } = require('../utilities/jwt');
const { verifyPassword } = require('../utilities/hashing');
const { sendEmail } = require('../utilities/emailService');

class UserSecurityService {
  constructor(db) {
    this.db = db;
    this.User = db.User;
    this.EmailVerification = db.EmailVerification;
  }

  async initiateEmailChange(userId, newEmail) {
    const user = await this.User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate verification token
    const token = generateToken({ 
      userId, 
      newEmail,
      type: 'email_change'
    }, '1h'); // 1 hour expiry

    // Store verification request
    await this.EmailVerification.create({
      userId,
      token,
      newEmail,
      type: 'email_change',
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    });

    // Send verification email to new address
    await sendEmail({
      to: newEmail,
      subject: 'Confirm your new email address',
      html: `
        <h1>Email Change Request</h1>
        <p>You have requested to change your email address to ${newEmail}.</p>
        <p>Please click the link below to confirm this change:</p>
        <a href="${process.env.FRONTEND_URL}/verify-email-change?token=${token}">
          Confirm Email Change
        </a>
        <p>This link will expire in 1 hour.</p>
      `
    });

    // Send notification to old email
    await sendEmail({
      to: user.email,
      subject: 'Email Change Requested',
      html: `
        <h1>Email Change Request</h1>
        <p>Someone has requested to change your email address to ${newEmail}.</p>
        <p>If this was not you, please contact support immediately.</p>
      `
    });

    return { message: 'Verification emails sent' };
  }

  async confirmEmailChange(token) {
    const verification = await this.EmailVerification.findOne({
      where: { token, type: 'email_change' }
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new Error('Invalid or expired token');
    }

    // Update user's email
    await this.User.update(
      { email: verification.newEmail, emailVerified: false },
      { where: { id: verification.userId } }
    );

    // Delete the verification record
    await verification.destroy();

    return { message: 'Email updated successfully' };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.salt, user.hashedPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const { salt, hashedPassword } = await hashPassword(newPassword);

    // Update password
    await this.User.update(
      { salt, hashedPassword },
      { where: { id: userId } }
    );

    // Send notification email
    await sendEmail({
      to: user.email,
      subject: 'Password Changed',
      html: `
        <h1>Password Changed</h1>
        <p>Your password was recently changed.</p>
        <p>If this was not you, please contact support immediately.</p>
      `
    });

    return { message: 'Password updated successfully' };
  }
}

module.exports = UserSecurityService; 