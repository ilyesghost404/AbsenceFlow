const db = require("../config/database");

class User {
  static async getAll() {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.employee_id, 
        u.is_active, 
        u.created_at, 
        u.updated_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
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
        u.created_at, 
        u.updated_at,
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
    const { username, email, password_hash, role, employee_id } = user;
    const result = await db.query(`
      INSERT INTO users (username, email, password_hash, role, employee_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role, employee_id, is_active, created_at, updated_at
    `, [username, email, password_hash, role, employee_id || null]);
    return result.rows[0];
  }

  static async update(id, user) {
    const { username, email, password_hash, role, employee_id, is_active } = user;
    
    let query;
    let params;

    if (password_hash) {
      query = `
        UPDATE users 
        SET username = $1, email = $2, password_hash = $3, role = $4, employee_id = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, username, email, role, employee_id, is_active, created_at, updated_at
      `;
      params = [username, email, password_hash, role, employee_id || null, is_active, id];
    } else {
      query = `
        UPDATE users 
        SET username = $1, email = $2, role = $3, employee_id = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, username, email, role, employee_id, is_active, created_at, updated_at
      `;
      params = [username, email, role, employee_id || null, is_active, id];
    }

    const result = await db.query(query, params);
    return result.rows[0];
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

  static async recordActivity(actorId, actionType, targetUserId, description, ipAddress) {
    const result = await db.query(`
      INSERT INTO activity_logs (actor_id, action_type, target_user_id, description, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [actorId || null, actionType, targetUserId || null, description || null, ipAddress || null]);
    return result.rows[0];
  }
}

module.exports = User;
