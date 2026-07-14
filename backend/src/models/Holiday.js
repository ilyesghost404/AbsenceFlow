const db = require("../config/database");

class Holiday {
  static async getAll() {
    const result = await db.query("SELECT * FROM holidays ORDER BY holiday_date ASC");
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query("SELECT * FROM holidays WHERE id = $1", [id]);
    return result.rows[0];
  }

  static async create(holidayData) {
    const { holiday_date, name, type, recurring, description, color } = holidayData;
    const result = await db.query(
      "INSERT INTO holidays (holiday_date, name, type, recurring, description, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [holiday_date, name, type || 'National', recurring || false, description || null, color || null]
    );
    return result.rows[0];
  }

  static async update(id, holidayData) {
    const { holiday_date, name, type, recurring, description, color } = holidayData;
    const result = await db.query(
      "UPDATE holidays SET holiday_date = $1, name = $2, type = $3, recurring = $4, description = $5, color = $6 WHERE id = $7 RETURNING *",
      [holiday_date, name, type || 'National', recurring || false, description || null, color || null, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      "DELETE FROM holidays WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Holiday;
