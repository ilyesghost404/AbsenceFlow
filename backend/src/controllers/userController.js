const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UAParser = require("ua-parser-js");
const emailService = require("../utils/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "absenceflow_jwt_secret_key_12345";

const login = async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const parser = new UAParser(req.headers["user-agent"]);
  const browserName = parser.getBrowser().name || "Unknown Browser";
  const deviceName = parser.getOS().name || "Unknown OS";

  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username/email and password are required" });
    }

    const user = await User.getByUsernameOrEmail(username);

    console.log(`[AUTH DEBUG] User query value: "${username}"`);
    console.log(`[AUTH DEBUG] User found: ${!!user}`);
    if (user) {
      console.log(`[AUTH DEBUG] User role: ${user.role}, is_active: ${user.is_active}, is_verified: ${user.is_verified}`);
      console.log(`[AUTH DEBUG] Password hash exists: ${!!user.password_hash}`);
      if (user.password_hash) {
        console.log(`[AUTH DEBUG] Password hash length: ${user.password_hash.length}`);
        console.log(`[AUTH DEBUG] Password hash prefix: "${user.password_hash.substring(0, 7)}"`);
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Account is disabled. Please contact your administrator." });
    }

    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: "Please verify your email address to login." });
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({ success: false, message: "Account temporarily locked due to multiple failed attempts. Try again later." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`[AUTH DEBUG] Bcrypt comparison result: ${isMatch}`);

    if (!isMatch) {
      const attempts = await User.incrementFailedAttempts(user.id);
      await User.recordLoginHistory(user.id, ipAddress, false, browserName, deviceName);
      
      if (attempts >= 5) {
        await User.lockAccount(user.id, 15);
        await emailService.sendAccountLockedEmail(user.email, user.username);
        return res.status(403).json({ success: false, message: "Account locked for 15 minutes due to too many failed attempts." });
      }
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Login successful
    await User.resetFailedAttempts(user.id);
    await User.recordLoginHistory(user.id, ipAddress, true, browserName, deviceName);
    await User.recordActivity(user.id, "login", user.id, `User '${user.username}' logged in`, ipAddress, browserName, deviceName);

    // Create JWT
    const jti = crypto.randomUUID();
    const expiresInStr = rememberMe ? "30d" : "1h"; // 1h for normal session to enforce timeout
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        employee_id: user.employee_id,
        jti // Add JWT ID for session tracking
      },
      JWT_SECRET,
      { expiresIn: expiresInStr }
    );

    // Calculate exact expiry date for DB
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await User.createSession(user.id, jti, ipAddress, browserName, deviceName, expiresAt);

    // Send new login email asynchronously (fire and forget)
    emailService.sendNewLoginEmail(user.email, user.username, browserName, deviceName, ipAddress, new Date()).catch(console.error);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          employee_id: user.employee_id,
          employee_name: user.employee_name
        }
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Failed to login user" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.getByUsernameOrEmail(email);
    if (!user || !user.is_active) {
      // Return a generic success response to prevent email enumeration
      return res.json({ success: true, message: "If that email is in our system, we have sent a password reset link." });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await User.savePasswordResetToken(user.id, tokenHash, expiresAt);

    // Send email
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordResetEmail(user.email, user.username, resetLink);

    // Generic response
    res.json({ success: true, message: "If that email is in our system, we have sent a password reset link." });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "An error occurred. Please try again." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetRecord = await User.getPasswordResetToken(tokenHash);

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    // Validate password strength (simple backend check)
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(resetRecord.user_id, password_hash);
    
    // Invalidate the token
    await User.deletePasswordResetToken(resetRecord.id);
    
    // Revoke all existing sessions
    await User.deleteAllUserSessions(resetRecord.user_id);

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(resetRecord.email, resetRecord.username);

    // Log activity
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await User.recordActivity(resetRecord.user_id, "password_reset", resetRecord.user_id, "Password was reset via email token", ipAddress);

    res.json({ success: true, message: "Password has been successfully reset. You can now log in." });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "An error occurred. Please try again." });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new passwords are required" });
    }

    const user = await User.getById(req.user.id); // For email/username
    const userWithHash = await User.getByUsernameOrEmail(user.username); // Need hash

    const isMatch = await bcrypt.compare(currentPassword, userWithHash.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect current password" });
    }

    const isSame = await bcrypt.compare(newPassword, userWithHash.password_hash);
    if (isSame) {
      return res.status(400).json({ success: false, message: "New password must be different from current password" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(req.user.id, password_hash);

    // Optionally revoke other sessions, for now just update password
    // Send email
    await emailService.sendPasswordChangedEmail(user.email, user.username);

    // Log activity
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await User.recordActivity(req.user.id, "password_changed", req.user.id, "Password was changed by user", ipAddress);

    res.json({ success: true, message: "Password changed successfully" });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const sessions = await User.getUserSessions(req.user.id);
    
    // Mark current session
    const sessionsWithCurrentFlag = sessions.map(s => ({
      ...s,
      isCurrent: s.token_jti === req.user.jti
    }));

    res.json({ success: true, data: sessionsWithCurrentFlag });
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch active sessions" });
  }
};

const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params; // this is the token_jti
    
    // Verify the session belongs to the user
    const session = await User.getSession(sessionId);
    if (!session || session.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (sessionId === req.user.jti) {
      return res.status(400).json({ success: false, message: "Cannot revoke current session this way. Use logout." });
    }

    await User.deleteSession(sessionId);
    res.json({ success: true, message: "Session revoked successfully" });
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({ success: false, message: "Failed to revoke session" });
  }
};

const revokeAllSessions = async (req, res) => {
  try {
    const sessions = await User.getUserSessions(req.user.id);
    
    // Delete all except current
    for (const session of sessions) {
      if (session.token_jti !== req.user.jti) {
        await User.deleteSession(session.token_jti);
      }
    }

    res.json({ success: true, message: "All other sessions revoked successfully" });
  } catch (error) {
    console.error("Revoke all sessions error:", error);
    res.status(500).json({ success: false, message: "Failed to revoke sessions" });
  }
};

const getLoginHistory = async (req, res) => {
  try {
    const db = require("../config/database");
    const result = await db.query(`
      SELECT * FROM login_history 
      WHERE user_id = $1 
      ORDER BY login_time DESC 
      LIMIT 20
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get login history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch login history" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        employee_id: user.employee_id,
        employee_name: user.employee_name,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user details" });
  }
};

const getUsers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await User.getAll({ 
      page: page ? parseInt(page, 10) : 1, 
      limit: limit ? parseInt(limit, 10) : 10,
      search: search || ''
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("GetUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users list" });
  }
};

const createUser = async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const { username, email, password, role, employee_id } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Username, email, password, and role are required" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password_hash,
      role,
      employee_id
    }); // Note: is_verified defaults to FALSE in the DB schema now

    // Generate Verification Token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(verifyToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await User.saveVerificationToken(newUser.id, tokenHash, expiresAt);

    // Send Verification Email
    const verifyLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;
    await emailService.sendVerificationEmail(email, username, verifyLink);

    // Log activity
    await User.recordActivity(
      req.user.id,
      "user_created",
      newUser.id,
      `User '${username}' created with role '${role}' by admin '${req.user.username}'. Verification email sent.`,
      ipAddress
    );

    res.status(201).json({ success: true, data: newUser });

  } catch (error) {
    console.error("CreateUser error:", error);
    if (error.code === "23505") {
      return res.status(400).json({ success: false, message: "Username or email already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
};

const updateUser = async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const { id } = req.params;
    const { username, email, password, role, employee_id, is_active } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ success: false, message: "Username, email, and role are required" });
    }

    // Fetch original user to detect changes
    const originalUser = await User.getById(id);

    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.update(id, {
      username,
      email,
      password_hash,
      role,
      employee_id,
      is_active: is_active === undefined ? true : is_active
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const actorName = req.user.username;
    const targetName = username;

    // Log role change
    if (originalUser && originalUser.role !== role) {
      await User.recordActivity(
        req.user.id,
        "role_changed",
        parseInt(id),
        `Role of '${targetName}' changed from '${originalUser.role}' to '${role}' by '${actorName}'`,
        ipAddress
      );
    }

    // Log account enable/disable
    if (originalUser && originalUser.is_active !== is_active) {
      const actionType = is_active ? "account_enabled" : "account_disabled";
      const actionLabel = is_active ? "enabled" : "disabled";
      await User.recordActivity(
        req.user.id,
        actionType,
        parseInt(id),
        `Account '${targetName}' ${actionLabel} by '${actorName}'`,
        ipAddress
      );
    }

    // Log password change
    if (password) {
      await User.recordActivity(
        req.user.id,
        "password_changed",
        parseInt(id),
        `Password changed for '${targetName}' by '${actorName}'`,
        ipAddress
      );
    }

    // Log general update (if nothing else specific changed)
    if (originalUser && originalUser.role === role && originalUser.is_active === is_active && !password) {
      await User.recordActivity(
        req.user.id,
        "user_updated",
        parseInt(id),
        `User '${targetName}' updated by '${actorName}'`,
        ipAddress
      );
    }

    res.json({ success: true, data: updatedUser });

  } catch (error) {
    console.error("UpdateUser error:", error);
    if (error.code === "23505") {
      return res.status(400).json({ success: false, message: "Username or email already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    // Fetch user info before deleting
    const targetUser = await User.getById(id);

    const deletedUser = await User.delete(id);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Log activity (target_user_id will be NULL after deletion due to ON DELETE SET NULL)
    await User.recordActivity(
      req.user.id,
      "user_deleted",
      null,
      `User '${targetUser?.username || id}' deleted by '${req.user.username}'`,
      ipAddress
    );

    res.json({ success: true, message: "User deleted successfully", data: deletedUser });

  } catch (error) {
    console.error("DeleteUser error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is required" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const verifyRecord = await User.getVerificationToken(tokenHash);

    if (!verifyRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
    }

    // Mark user as verified
    await User.verifyUserEmail(verifyRecord.user_id);
    
    // Invalidate token
    await User.deleteVerificationToken(verifyRecord.id);

    // Log activity
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await User.recordActivity(verifyRecord.user_id, "email_verified", verifyRecord.user_id, "User verified their email address", ipAddress);

    res.json({ success: true, message: "Email verified successfully. You can now log in." });

  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ success: false, message: "An error occurred during verification" });
  }
};

const update2FA = async (req, res) => {
  try {
    const { enabled, type } = req.body;
    
    const db = require("../config/database");
    await db.query(`
      UPDATE users 
      SET two_factor_enabled = $1, two_factor_type = $2
      WHERE id = $3
    `, [enabled, type || null, req.user.id]);

    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await User.recordActivity(req.user.id, "2fa_updated", req.user.id, `2FA ${enabled ? 'enabled' : 'disabled'} (${type || 'none'})`, ipAddress);

    res.json({ success: true, message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}.` });
  } catch (error) {
    console.error("2FA update error:", error);
    res.status(500).json({ success: false, message: "Failed to update 2FA settings" });
  }
};

// --- Admin Security Center ---

const getGlobalAuditLogs = async (req, res) => {
  try {
    const db = require("../config/database");
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM activity_logs al
      LEFT JOIN users u ON al.actor_id = u.id
    `;
    let countQuery = `SELECT COUNT(*) ${baseQuery}`;
    let dataQuery = `
      SELECT al.*, u.username as actor_username
      ${baseQuery}
    `;

    const queryParams = [];
    let whereClause = '';

    if (search) {
      whereClause = ` WHERE u.username ILIKE $1 OR al.action_type ILIKE $1 OR al.description ILIKE $1`;
      queryParams.push(`%${search}%`);
      dataQuery += whereClause;
      countQuery += whereClause;
    }

    dataQuery += ` ORDER BY al.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    const countResult = await db.query(countQuery, search ? [queryParams[0]] : []);
    const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

    res.json({
      success: true,
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit)
    });
  } catch (error) {
    console.error("Get global audit logs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
  }
};

const adminLockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body;
    
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot lock your own account" });
    }

    if (minutes > 0) {
      await User.lockAccount(id, minutes);
    } else {
      // Unlock
      await User.resetFailedAttempts(id);
    }

    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await User.recordActivity(
      req.user.id, 
      minutes > 0 ? "account_locked" : "account_unlocked", 
      id, 
      `Account ${minutes > 0 ? `locked for ${minutes} mins` : 'unlocked'} by admin '${req.user.username}'`, 
      ipAddress
    );

    res.json({ success: true, message: `Account ${minutes > 0 ? 'locked' : 'unlocked'} successfully` });
  } catch (error) {
    console.error("Admin lock user error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to lock/unlock user" });
  }
};

const adminRevokeUserSessions = async (req, res) => {
  try {
    const { id } = req.params;
    await User.deleteAllUserSessions(id);
    
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await User.recordActivity(req.user.id, "sessions_revoked", id, `All sessions revoked by admin '${req.user.username}'`, ipAddress);

    res.json({ success: true, message: "All sessions for the user revoked successfully" });
  } catch (error) {
    console.error("Admin revoke sessions error:", error);
    res.status(500).json({ success: false, message: "Failed to revoke user sessions" });
  }
};

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
  verifyEmail,
  update2FA,
  getGlobalAuditLogs,
  adminLockUser,
  adminRevokeUserSessions,
  getMe,
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
