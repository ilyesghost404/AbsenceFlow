const db = require("../config/database");

class FaceProfile {
  static async getByEmployeeId(employeeId) {
    const result = await db.query(
      "SELECT * FROM face_profiles WHERE employee_id = $1",
      [employeeId]
    );
    if (!result.rows[0]) return null;
    
    let profile = result.rows[0];
    if (typeof profile.face_embedding === 'string') {
      try {
        profile.face_embedding = JSON.parse(profile.face_embedding);
      } catch (e) {
        console.error(`❌ Failed to parse face_embedding string for employee ${employeeId}:`, e);
      }
    }
    return profile;
  }

  static async create(employeeId, faceEmbedding) {
    if (!faceEmbedding || (!Array.isArray(faceEmbedding) && typeof faceEmbedding !== 'string')) {
      throw new Error("Invalid or missing face embedding provided to FaceProfile.create");
    }
    const jsonVal = typeof faceEmbedding === 'string' ? faceEmbedding : JSON.stringify(faceEmbedding);
    const result = await db.query(
      `INSERT INTO face_profiles (employee_id, face_embedding, embedding_version, status, face_enabled, face_registered_at, registered_at, updated_at)
       VALUES ($1, $2::jsonb, 'arcface_v1', 'active', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [employeeId, jsonVal]
    );
    return result.rows[0];
  }

  static async update(employeeId, faceEmbedding) {
    if (!faceEmbedding || (!Array.isArray(faceEmbedding) && typeof faceEmbedding !== 'string')) {
      throw new Error("Invalid or missing face embedding provided to FaceProfile.update");
    }
    const jsonVal = typeof faceEmbedding === 'string' ? faceEmbedding : JSON.stringify(faceEmbedding);
    const result = await db.query(
      `UPDATE face_profiles
       SET face_embedding = $1::jsonb, embedding_version = 'arcface_v1', status = 'active', face_enabled = true, face_registered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $2
       RETURNING *`,
      [jsonVal, employeeId]
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
