const db = require("../config/database");

class FaceProfile {
  static async getByEmployeeId(employeeId) {
    const result = await db.query(
      "SELECT * FROM face_profiles WHERE employee_id = $1",
      [employeeId]
    );
    return result.rows[0];
  }

  static async create(employeeId, faceEmbedding) {
    const result = await db.query(
      `INSERT INTO face_profiles (employee_id, face_embedding, embedding_version, status, face_enabled, face_registered_at, registered_at, updated_at)
       VALUES ($1, $2, 'arcface_v1', 'active', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [employeeId, JSON.stringify(faceEmbedding)]
    );
    return result.rows[0];
  }

  static async update(employeeId, faceEmbedding) {
    const result = await db.query(
      `UPDATE face_profiles
       SET face_embedding = $1, embedding_version = 'arcface_v1', face_enabled = true, face_registered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $2
       RETURNING *`,
      [JSON.stringify(faceEmbedding), employeeId]
    );
    return result.rows[0];
  }

  static async recordVerification(employeeId) {
    await db.query(
      `UPDATE face_profiles
       SET last_face_verification = CURRENT_TIMESTAMP
       WHERE employee_id = $1`,
      [employeeId]
    );
  }

  static async delete(employeeId) {
    const result = await db.query(
      "DELETE FROM face_profiles WHERE employee_id = $1 RETURNING *",
      [employeeId]
    );
    return result.rows[0];
  }
}

module.exports = FaceProfile;
