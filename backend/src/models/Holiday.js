const db = require("../config/database");

class Holiday {
  static async getAll(params = {}) {
    const { page = 1, limit = 10, search = '' } = params;
    const offset = (page - 1) * limit;

    let baseQuery = "FROM holidays";
    let countQuery = `SELECT COUNT(*) ${baseQuery}`;
    let dataQuery = `SELECT * ${baseQuery}`;
    const queryParams = [];
    let whereClause = '';

    if (search) {
        whereClause = ` WHERE name ILIKE $1 OR description ILIKE $1 OR type ILIKE $1`;
        queryParams.push(`%${search}%`);
        dataQuery += whereClause;
        countQuery += whereClause;
    }

    dataQuery += ` ORDER BY holiday_date ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    const countResult = await db.query(countQuery, search ? [queryParams[0]] : []);
    const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

    return {
        data: dataResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit)
    };
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
