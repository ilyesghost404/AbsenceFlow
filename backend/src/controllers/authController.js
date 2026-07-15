const User = require("../models/User");
const bcrypt = require("bcryptjs");
const emailService = require("../utils/emailService");

const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) return false;
  let categories = 0;
  if (/[A-Z]/.test(password)) categories++;
  if (/[a-z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^A-Za-z0-9]/.test(password)) categories++;
  return categories >= 3;
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.getPasswordResetCodeInfo(email);
    if (!user || !user.is_active) {
      // Security: Do not reveal if email exists, return generic message
      return res.json({ message: "Verification code sent" });
    }

    // Generate secure 6 digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Code expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save code to database
    await User.savePasswordResetCode(user.id, code, expiresAt);

    // Send email with verification code
    await emailService.sendOtpEmail(user.email, user.username, code, 10);

    res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "An error occurred. Please try again." });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email and code are required" });
    }

    const user = await User.getPasswordResetCodeInfo(email);
    if (!user || !user.is_active) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    // Check code matches
    if (!user.reset_password_code || user.reset_password_code !== code) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    // Check code is not expired
    const expiry = new Date(user.reset_password_code_expiry);
    if (expiry < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    // Set reset_password_verified = true
    await User.setPasswordResetCodeVerified(user.id, true);

    res.json({ message: "Code verified" });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({ success: false, message: "An error occurred. Please try again." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: "Email and new password are required" });
    }

    const user = await User.getPasswordResetCodeInfo(email);
    if (!user || !user.is_active) {
      return res.status(400).json({ success: false, message: "User not found or inactive" });
    }

    // Requirements: User must have verified the code first
    if (!user.reset_password_verified) {
      return res.status(400).json({ success: false, message: "You must verify the code before resetting your password." });
    }

    // Verify time limit of the code has not expired
    const expiry = new Date(user.reset_password_code_expiry);
    if (expiry < new Date()) {
      return res.status(400).json({ success: false, message: "Password reset window has expired. Please request a new code." });
    }

    // Validate password strength
    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is too weak. It must be at least 8 characters long and contain a mix of uppercase, lowercase, numbers, and special characters." 
      });
    }

    // Hash password using bcryptjs
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password, clear reset fields (code = NULL, code_expiry = NULL, reset_password_verified = false, password_changed_at = CURRENT_TIMESTAMP)
    await User.resetPasswordWithCode(user.id, passwordHash);

    // Revoke all existing sessions
    await User.deleteAllUserSessions(user.id);

    // Send confirmation email
    try {
      await emailService.sendPasswordChangedEmail(user.email, user.username);
    } catch (emailErr) {
      console.error("Failed to send password reset confirmation email:", emailErr);
    }

    // Log activity
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await User.recordActivity(user.id, "password_reset", user.id, "Password reset successfully via email verification code (OTP)", ipAddress);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "An error occurred. Please try again." });
  }
};

module.exports = {
  forgotPassword,
  verifyResetCode,
  resetPassword
};
