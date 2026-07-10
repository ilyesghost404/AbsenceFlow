const db = require("../config/database");

class Holiday {
  static async getAll() {
    const result = await db.query("SELECT * FROM holidays ORDER BY holiday_date DESC");
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query("SELECT * FROM holidays WHERE id = $1", [id]);
    return result.rows[0];
  }

  static async create(holidayData) {
    const { holiday_date, name } = holidayData;
    const result = await db.query(
      "INSERT INTO holidays (holiday_date, name) VALUES ($1, $2) RETURNING *",
      [holiday_date, name]
    );
    return result.rows[0];
  }

  static async update(id, holidayData) {
    const { holiday_date, name } = holidayData;
    const result = await db.query(
      "UPDATE holidays SET holiday_date = $1, name = $2 WHERE id = $3 RETURNING *",
      [holiday_date, name, id]
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
