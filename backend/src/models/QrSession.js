const db = require("../config/database");

class QrSession {
  static async create(companyId, token, expiresAt) {
    const result = await db.query(
      `INSERT INTO qr_sessions (company_id, token, expires_at, used)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [companyId || 1, token, expiresAt]
    );
    return result.rows[0];
  }

  static async getByToken(token) {
    const result = await db.query(
      "SELECT * FROM qr_sessions WHERE token = $1",
      [token]
    );
    return result.rows[0];
  }

  static async markAsUsed(id) {
    const result = await db.query(
      `UPDATE qr_sessions
       SET used = true
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = QrSession;
