const db = require("../config/database");

class User {
  static async getAll(params = {}) {
    const { page = 1, limit = 10, search = '' } = params;
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
    `;
    let countQuery = `SELECT COUNT(*) ${baseQuery}`;
    let dataQuery = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.employee_id, 
        u.is_active, 
        u.is_verified,
        u.account_status,
        u.created_at, 
        u.updated_at,
        u.locked_until,
        u.two_factor_enabled,
        u.face_id_enabled,
        (SELECT COUNT(*)::int FROM user_sessions us WHERE us.user_id = u.id AND us.expires_at > CURRENT_TIMESTAMP) as active_sessions,
        (SELECT MAX(lh.login_time) FROM login_history lh WHERE lh.user_id = u.id AND lh.success = true) as last_login,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name
      ${baseQuery}
    `;

    const queryParams = [];
    let whereClause = '';

    if (search) {
      whereClause = `
        WHERE u.username ILIKE $1 
        OR u.email ILIKE $1 
        OR CONCAT(e.first_name, ' ', e.last_name) ILIKE $1
      `;
      queryParams.push(`%${search}%`);
      dataQuery += whereClause;
      countQuery += whereClause;
    }

    dataQuery += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    
    const countResult = await db.query(countQuery, search ? [queryParams[0]] : []);
    const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

    // Fetch system-wide security statistics from database
    const statsResult = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE is_active = true AND (locked_until IS NULL OR locked_until <= CURRENT_TIMESTAMP)) AS active_accounts,
        (SELECT COUNT(*)::int FROM users WHERE locked_until > CURRENT_TIMESTAMP) AS locked_accounts,
        (SELECT COUNT(*)::int FROM users WHERE is_active = false) AS disabled_accounts,
        (SELECT COUNT(DISTINCT user_id)::int FROM user_sessions WHERE expires_at > CURRENT_TIMESTAMP) AS online_users,
        (SELECT MAX(created_at) FROM activity_logs) AS last_activity
    `);
    const stats = statsResult.rows[0];
    const totalUsers = parseInt(stats.total_users || 0, 10);
    const onlineUsers = parseInt(stats.online_users || 0, 10);
    stats.offline_users = Math.max(0, totalUsers - onlineUsers);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
      stats: stats
    };
  }

  static async getById(id) {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.employee_id, 
        u.is_active, 
        u.account_status,
        u.created_at, 
        u.updated_at,
        u.face_id_enabled,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByUsernameOrEmail(value) {
    // We need the password_hash for login verification, so we select *
    const result = await db.query(`
      SELECT u.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.username = $1 OR u.email = $1
    `, [value]);
    return result.rows[0];
  }

  static async create(user) {
    const { username, email, password_hash, role, employee_id, account_status, activation_token, activation_token_expiry, is_verified, is_active } = user;
    const finalAccountStatus = account_status || 'Active';
    const finalIsVerified = is_verified !== undefined ? is_verified : (finalAccountStatus === 'Active');
    const finalIsActive = is_active !== undefined ? is_active : true;

    const result = await db.query(`
      INSERT INTO users (username, email, password_hash, role, employee_id, account_status, activation_token, activation_token_expiry, is_verified, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, username, email, role, employee_id, is_active, is_verified, account_status, created_at, updated_at
    `, [username, email, password_hash, role, employee_id || null, finalAccountStatus, activation_token || null, activation_token_expiry || null, finalIsVerified, finalIsActive]);
    return result.rows[0];
  }

  static async update(id, user) {
    const { username, email, password_hash, role, employee_id, is_active } = user;
    
    let query;
    let params;

    if (password_hash) {
      query = `
        UPDATE users 
        SET username = $1, email = $2, password_hash = $3, role = $4, employee_id = $5, is_active = $6, account_status = 'Active', is_verified = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, username, email, role, employee_id, is_active, is_verified, account_status, created_at, updated_at
      `;
      params = [username, email, password_hash, role, employee_id || null, is_active, id];
    } else {
      query = `
        UPDATE users 
        SET username = $1, email = $2, role = $3, employee_id = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, username, email, role, employee_id, is_active, is_verified, account_status, created_at, updated_at
      `;
      params = [username, email, role, employee_id || null, is_active, id];
    }

    const result = await db.query(query, params);
    return result.rows[0];
  }

  static async getByActivationToken(token) {
    const result = await db.query(`
      SELECT * FROM users 
      WHERE activation_token = $1 AND activation_token_expiry > CURRENT_TIMESTAMP
    `, [token]);
    return result.rows[0];
  }

  static async activateAccount(userId, passwordHash) {
    await db.query(`
      UPDATE users 
      SET password_hash = $1, account_status = 'Active', is_verified = TRUE, activation_token = NULL, activation_token_expiry = NULL, activated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [passwordHash, userId]);
  }

  static async delete(id) {
    const result = await db.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
    return result.rows[0];
  }

  static async recordLogin(userId, ipAddress, success = true) {
    const result = await db.query(`
      INSERT INTO login_history (user_id, ip_address, success)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, ipAddress, success]);
    return result.rows[0];
  }

  static async recordActivity(actorId, actionType, targetUserId, description, ipAddress, browser = null, device = null) {
    const result = await db.query(`
      INSERT INTO activity_logs (actor_id, action_type, target_user_id, description, ip_address, browser, device)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [actorId || null, actionType, targetUserId || null, description || null, ipAddress || null, browser, device]);
    return result.rows[0];
  }

  // --- Security & Login Tracking ---

  static async incrementFailedAttempts(userId) {
    const result = await db.query(`
      UPDATE users 
      SET failed_attempts = failed_attempts + 1
      WHERE id = $1
      RETURNING failed_attempts
    `, [userId]);
    return result.rows[0]?.failed_attempts || 0;
  }

  static async resetFailedAttempts(userId) {
    await db.query(`
      UPDATE users 
      SET failed_attempts = 0, locked_until = NULL
      WHERE id = $1
    `, [userId]);
  }

  static async lockAccount(userId, durationMinutes) {
    await db.query(`
      UPDATE users 
      SET locked_until = NOW() + ($2 || ' minutes')::interval
      WHERE id = $1
    `, [userId, durationMinutes]);
  }

  static async recordLoginHistory(userId, ipAddress, success = true, browser = null, device = null) {
    const result = await db.query(`
      INSERT INTO login_history (user_id, ip_address, success, browser, device)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, ipAddress, success, browser, device]);
    return result.rows[0];
  }

  // --- Session Management ---

  static async createSession(userId, tokenJti, ipAddress, browser, device, expiresAt) {
    const result = await db.query(`
      INSERT INTO user_sessions (user_id, token_jti, ip_address, browser, device, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, tokenJti, ipAddress, browser, device, expiresAt]);
    return result.rows[0];
  }

  static async getSession(tokenJti) {
    const result = await db.query(`
      SELECT * FROM user_sessions WHERE token_jti = $1
    `, [tokenJti]);
    return result.rows[0];
  }

  static async updateSessionActivity(tokenJti) {
    await db.query(`
      UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE token_jti = $1
    `, [tokenJti]);
  }

  static async deleteSession(tokenJti) {
    await db.query(`
      DELETE FROM user_sessions WHERE token_jti = $1
    `, [tokenJti]);
  }

  static async deleteAllUserSessions(userId) {
    await db.query(`
      DELETE FROM user_sessions WHERE user_id = $1
    `, [userId]);
  }

  static async getUserSessions(userId) {
    const result = await db.query(`
      SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY last_activity DESC
    `, [userId]);
    return result.rows;
  }

  // --- Password Management ---

  static async savePasswordResetToken(userId, tokenHash, expiresAt) {
    const result = await db.query(`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, tokenHash, expiresAt]);
    return result.rows[0];
  }

  static async getPasswordResetToken(tokenHash) {
    const result = await db.query(`
      SELECT prt.*, u.username, u.email 
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token_hash = $1 AND prt.expires_at > CURRENT_TIMESTAMP
    `, [tokenHash]);
    return result.rows[0];
  }

  static async deletePasswordResetToken(tokenId) {
    await db.query(`
      DELETE FROM password_reset_tokens WHERE id = $1
    `, [tokenId]);
  }

  static async updatePassword(userId, passwordHash) {
    await db.query(`
      UPDATE users 
      SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [passwordHash, userId]);
  }

  // --- Email Verification ---

  static async saveVerificationToken(userId, tokenHash, expiresAt) {
    const result = await db.query(`
      INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, tokenHash, expiresAt]);
    return result.rows[0];
  }

  static async getVerificationToken(tokenHash) {
    const result = await db.query(`
      SELECT evt.*, u.username, u.email 
      FROM email_verification_tokens evt
      JOIN users u ON evt.user_id = u.id
      WHERE evt.token_hash = $1 AND evt.expires_at > CURRENT_TIMESTAMP
    `, [tokenHash]);
    return result.rows[0];
  }

  static async verifyUserEmail(userId) {
    await db.query(`
      UPDATE users 
      SET is_verified = TRUE
      WHERE id = $1
    `, [userId]);
  }

  static async deleteVerificationToken(tokenId) {
    await db.query(`
      DELETE FROM email_verification_tokens WHERE id = $1
    `, [tokenId]);
  }

  // --- OTP Forgot Password Methods ---

  static async savePasswordResetCode(userId, code, expiresAt) {
    await db.query(`
      UPDATE users
      SET reset_password_code = $1, reset_password_code_expiry = $2, reset_password_verified = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [code, expiresAt, userId]);
  }

  static async getPasswordResetCodeInfo(email) {
    const result = await db.query(`
      SELECT id, username, email, reset_password_code, reset_password_code_expiry, reset_password_verified, is_active
      FROM users
      WHERE email = $1
    `, [email]);
    return result.rows[0];
  }

  static async setPasswordResetCodeVerified(userId, verified) {
    await db.query(`
      UPDATE users
      SET reset_password_verified = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [verified, userId]);
  }

  static async resetPasswordWithCode(userId, passwordHash) {
    await db.query(`
      UPDATE users
      SET password_hash = $1,
          reset_password_code = NULL,
          reset_password_code_expiry = NULL,
          reset_password_verified = FALSE,
          password_changed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [passwordHash, userId]);
  }

  static async savePasswordDuringActivation(userId, passwordHash) {
    await db.query(`
      UPDATE users 
      SET password_hash = $1, 
          account_status = 'Pending_Face', 
          is_verified = TRUE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [passwordHash, userId]);
  }

  static async completeActivation(userId) {
    await db.query(`
      UPDATE users
      SET account_status = 'Active', 
          is_verified = TRUE,
          activation_token = NULL, 
          activation_token_expiry = NULL, 
          activated_at = CURRENT_TIMESTAMP, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId]);
  }

  static async updateFaceIdEnabled(userId, enabled) {
    await db.query(`
      UPDATE users
      SET face_id_enabled = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [enabled, userId]);
  }
}

module.exports = User;
