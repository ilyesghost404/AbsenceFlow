const db = require("../config/database");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ─── Profile ─────────────────────────────────────────────────────────────────

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.updated_at,
        CONCAT(e.first_name, ' ', e.last_name) AS full_name,
        e.phone, e.department, e.position
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ success: false, message: "Username and email are required" });
    }

    // Check uniqueness (exclude self)
    const dupeCheck = await db.query(
      `SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3`,
      [username, email, userId]
    );
    if (dupeCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Username or email already taken" });
    }

    const result = await db.query(`
      UPDATE users SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, email, role, is_active, created_at, updated_at
    `, [username, email, userId]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// ─── Notifications ───────────────────────────────────────────────────────────

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Upsert: create defaults if row doesn't exist
    let result = await db.query(`SELECT * FROM user_settings WHERE user_id = $1`, [userId]);
    if (result.rows.length === 0) {
      result = await db.query(
        `INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
    }

    const s = result.rows[0];
    res.json({
      success: true,
      data: {
        absence_notifications: s.absence_notifications,
        approval_notifications: s.approval_notifications,
        holiday_notifications: s.holiday_notifications,
        report_notifications: s.report_notifications,
      }
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ success: false, message: "Failed to load notification settings" });
  }
};

const updateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      absence_notifications,
      approval_notifications,
      holiday_notifications,
      report_notifications,
    } = req.body;

    // Upsert
    const result = await db.query(`
      INSERT INTO user_settings (user_id, absence_notifications, approval_notifications, holiday_notifications, report_notifications, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        absence_notifications = EXCLUDED.absence_notifications,
        approval_notifications = EXCLUDED.approval_notifications,
        holiday_notifications = EXCLUDED.holiday_notifications,
        report_notifications = EXCLUDED.report_notifications,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, absence_notifications, approval_notifications, holiday_notifications, report_notifications]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("updateNotifications error:", error);
    res.status(500).json({ success: false, message: "Failed to update notification settings" });
  }
};

// ─── Appearance ──────────────────────────────────────────────────────────────

const getAppearance = async (req, res) => {
  try {
    const userId = req.user.id;

    let result = await db.query(`SELECT * FROM user_settings WHERE user_id = $1`, [userId]);
    if (result.rows.length === 0) {
      result = await db.query(
        `INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
    }

    const s = result.rows[0];
    res.json({
      success: true,
      data: {
        theme: s.theme || 'system',
        compact_mode: s.compact_mode || false,
        sidebar_collapsed: s.sidebar_collapsed || false,
      }
    });
  } catch (error) {
    console.error("getAppearance error:", error);
    res.status(500).json({ success: false, message: "Failed to load appearance settings" });
  }
};

const updateAppearance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme, compact_mode, sidebar_collapsed } = req.body;

    const validThemes = ['light', 'dark', 'system'];
    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ success: false, message: "Invalid theme value" });
    }

    const result = await db.query(`
      INSERT INTO user_settings (user_id, theme, compact_mode, sidebar_collapsed, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        theme = EXCLUDED.theme,
        compact_mode = EXCLUDED.compact_mode,
        sidebar_collapsed = EXCLUDED.sidebar_collapsed,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, theme || 'system', compact_mode ?? false, sidebar_collapsed ?? false]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("updateAppearance error:", error);
    res.status(500).json({ success: false, message: "Failed to update appearance settings" });
  }
};

// ─── Security ────────────────────────────────────────────────────────────────

const getSecurityInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user role
    const userResult = await db.query(
      `SELECT role, created_at FROM users WHERE id = $1`, [userId]
    );

    // Last successful login
    const loginResult = await db.query(`
      SELECT login_time, ip_address FROM login_history
      WHERE user_id = $1 AND success = true
      ORDER BY login_time DESC LIMIT 2
    `, [userId]);

    // The most recent is the current session; the one before is the previous login
    const currentLogin = loginResult.rows[0] || null;
    const previousLogin = loginResult.rows[1] || null;

    res.json({
      success: true,
      data: {
        role: userResult.rows[0]?.role,
        member_since: userResult.rows[0]?.created_at,
        current_login: currentLogin ? { time: currentLogin.login_time, ip: currentLogin.ip_address } : null,
        previous_login: previousLogin ? { time: previousLogin.login_time, ip: previousLogin.ip_address } : null,
      }
    });
  } catch (error) {
    console.error("getSecurityInfo error:", error);
    res.status(500).json({ success: false, message: "Failed to load security info" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: "Current and new passwords are required" });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    // Get current hash
    const userResult = await db.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    // Hash new password and save
    const newHash = await bcrypt.hash(new_password, 10);
    await db.query(`
      UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [newHash, userId]);

    // Log the password change
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await User.recordActivity(
      userId,
      "password_changed",
      userId,
      `User changed their own password`,
      ipAddress
    );

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
  updateNotifications,
  getAppearance,
  updateAppearance,
  getSecurityInfo,
  changePassword,
};
