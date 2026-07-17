const db = require("../config/database");

class FaceSecurityLog {
  static async record(employeeId, action, result, confidence = null) {
    const query = `
      INSERT INTO face_security_logs (employee_id, action, result, confidence, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const params = [employeeId, action, result, confidence];
    const res = await db.query(query, params);
    return res.rows[0];
  }
}

module.exports = FaceSecurityLog;
