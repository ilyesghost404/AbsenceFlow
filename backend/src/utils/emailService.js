const nodemailer = require("nodemailer");

// For development, we'll use a test account if no SMTP provided
// In production, configure SMTP in .env
let transporter;

const initTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Ethereal for testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`Ethereal Email created. User: ${testAccount.user}`);
  }
};

initTransporter();

const sendEmail = async (to, subject, htmlContent) => {
  if (!transporter) await initTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: '"AbsenceFlow Security" <security@absenceflow.com>',
      to,
      subject,
      html: htmlContent,
    });
    
    // In dev, log the ethereal URL
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// --- Templates ---

const sendNewLoginEmail = async (userEmail, username, browser, device, ip, time) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #333;">New Login Detected</h2>
      <p>Hello ${username},</p>
      <p>We noticed a new login to your AbsenceFlow account with the following details:</p>
      <ul>
        <li><strong>Time:</strong> ${new Date(time).toLocaleString()}</li>
        <li><strong>Device:</strong> ${device || 'Unknown'}</li>
        <li><strong>Browser:</strong> ${browser || 'Unknown'}</li>
        <li><strong>IP Address:</strong> ${ip}</li>
      </ul>
      <p>If this was you, you can safely ignore this email.</p>
      <p style="color: #d9534f; font-weight: bold;">If you did not authorize this login, please change your password immediately and contact support.</p>
    </div>
  `;
  return sendEmail(userEmail, "Security Alert: New Login Detected", html);
};

const sendPasswordResetEmail = async (userEmail, username, resetLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello ${username},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0;">Reset Password</a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
  `;
  return sendEmail(userEmail, "Reset Your Password", html);
};

const sendPasswordChangedEmail = async (userEmail, username) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #333;">Password Changed Successfully</h2>
      <p>Hello ${username},</p>
      <p>Your password was just changed successfully.</p>
      <p>If you did not perform this action, please contact your administrator immediately.</p>
    </div>
  `;
  return sendEmail(userEmail, "Password Changed", html);
};

const sendAccountLockedEmail = async (userEmail, username) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #d9534f;">Account Locked</h2>
      <p>Hello ${username},</p>
      <p>Your account has been temporarily locked for 15 minutes due to multiple failed login attempts.</p>
      <p>If you forgot your password, please use the "Forgot Password" feature after the lockout period expires.</p>
    </div>
  `;
  return sendEmail(userEmail, "Security Alert: Account Locked", html);
};

const sendVerificationEmail = async (userEmail, username, verificationLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #333;">Welcome to AbsenceFlow</h2>
      <p>Hello ${username},</p>
      <p>An account has been created for you. Please verify your email address to activate your account and set your password:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0;">Verify Email & Activate Account</a>
      <p>This link is valid for 24 hours.</p>
    </div>
  `;
  return sendEmail(userEmail, "Activate Your Account", html);
};

module.exports = {
  sendNewLoginEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendAccountLockedEmail,
  sendVerificationEmail
};
