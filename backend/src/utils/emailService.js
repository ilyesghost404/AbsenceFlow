const nodemailer = require("nodemailer");

let transporter;

const initTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    console.error("Gmail SMTP credentials are not configured in .env");
  }
};

initTransporter();

const sendEmail = async (to, subject, htmlContent) => {
  if (!transporter) {
    console.error("Email service is not configured. Email not sent.");
    return false;
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'WinSAP'}" <${process.env.EMAIL_FROM || 'no-reply@winsap.com'}>`,
      to,
      subject,
      html: htmlContent,
    });
    
    console.log(`Email successfully sent to ${to}. Message ID: ${info.messageId}`);
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
      <p>We noticed a new login to your WinSAP account with the following details:</p>
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
      <h2 style="color: #333;">Welcome to WinSAP</h2>
      <p>Hello ${username},</p>
      <p>An account has been created for you. Please verify your email address to activate your account and set your password:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0;">Verify Email & Activate Account</a>
      <p>This link is valid for 24 hours.</p>
    </div>
  `;
  return sendEmail(userEmail, "Activate Your Account", html);
};

const sendActivationEmail = async (userEmail, username, activationLink) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 0; margin: 0; color: #334155;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">WinSAP</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 32px;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 600;">Welcome, ${username}!</h2>
          
          <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
            An account has been created for you by the administrator. To get started, please activate your account and set up your secure password.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${activationLink}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
              Activate Your Account
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; line-height: 20px; margin-bottom: 8px;">
            <strong>Note:</strong> This activation link will expire in exactly 24 hours for security reasons.
          </p>
          
          <p style="font-size: 14px; color: #64748b; line-height: 20px;">
            If the button doesn't work, you can copy and paste the following link into your browser:<br>
            <a href="${activationLink}" style="color: #2563eb; word-break: break-all;">${activationLink}</a>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">
            Need help? Contact your IT administrator or reply to this email.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} WinSAP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(userEmail, "Activate Your WinSAP Account", html);
};

const sendOtpEmail = async (userEmail, username, otpCode, expiryMinutes = 10) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 0; margin: 0; color: #334155;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">WinSAP</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 32px; text-align: center;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
          
          <p style="font-size: 16px; line-height: 24px; color: #64748b; margin-bottom: 24px; text-align: left;">
            Hello ${username},<br><br>
            We received a request to reset your password for your WinSAP account. Please use the verification code below to verify your identity and set a new password:
          </p>
          
          <!-- OTP Box -->
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px dashed #cbd5e1;">
            <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; margin-bottom: 8px;">Verification Code</span>
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; color: #2563eb; letter-spacing: 6px;">${otpCode}</span>
          </div>
          
          <p style="font-size: 14px; color: #d9534f; font-weight: 600; line-height: 20px; margin-bottom: 24px;">
            ⚠️ This verification code is valid for ${expiryMinutes} minutes. For security reasons, do not share this code with anyone.
          </p>
          
          <p style="font-size: 13px; color: #94a3b8; line-height: 20px; text-align: left; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">
            Need help? Contact your administrator.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} WinSAP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(userEmail, "WinSAP Password Reset Code", html);
};

module.exports = {
  sendNewLoginEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendAccountLockedEmail,
  sendVerificationEmail,
  sendActivationEmail,
  sendOtpEmail
};
