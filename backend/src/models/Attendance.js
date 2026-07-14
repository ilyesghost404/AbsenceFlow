const db = require("../config/database");

class Attendance {
  static async getAll(params = {}) {
    const { page = 1, limit = 10, search = '' } = params;
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM attendance
      JOIN employees ON attendance.employee_id = employees.id
    `;
    let countQuery = `SELECT COUNT(*) ${baseQuery}`;
    let dataQuery = `
      SELECT
        attendance.id,
        employees.matricule,
        employees.first_name,
        employees.last_name,
        attendance.date,
        attendance.check_in,
        attendance.check_out,
        attendance.status,
        attendance.created_at
      ${baseQuery}
    `;

    const queryParams = [];
    let whereClause = '';

    if (search) {
      whereClause = `
        WHERE employees.first_name ILIKE $1 
        OR employees.last_name ILIKE $1 
        OR employees.matricule ILIKE $1
      `;
      queryParams.push(`%${search}%`);
      dataQuery += whereClause;
      countQuery += whereClause;
    }

    dataQuery += ` ORDER BY attendance.date DESC, attendance.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

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
    const result = await db.query(`
      SELECT
        attendance.id,
        employees.matricule,
        employees.first_name,
        employees.last_name,
        attendance.employee_id,
        attendance.date,
        attendance.check_in,
        attendance.check_out,
        attendance.status,
        attendance.created_at
      FROM attendance
      JOIN employees ON attendance.employee_id = employees.id
      WHERE attendance.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create(attendanceData) {
    const { employee_id, date, check_in, check_out, status } = attendanceData;
    const result = await db.query(
      `INSERT INTO attendance (employee_id, date, check_in, check_out, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [employee_id, date, check_in, check_out, status]
    );
    return result.rows[0];
  }

  static async update(id, attendanceData) {
    const { employee_id, date, check_in, check_out, status } = attendanceData;
    const result = await db.query(
      `UPDATE attendance
       SET employee_id = $1, date = $2, check_in = $3, check_out = $4, status = $5
       WHERE id = $6
       RETURNING *`,
      [employee_id, date, check_in, check_out, status, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      `DELETE FROM attendance WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async checkIn(employeeId) {
    // Check if employee already has attendance today
    const existingResult = await db.query(
      `SELECT * FROM attendance 
       WHERE employee_id = $1 AND date = CURRENT_DATE`,
      [employeeId]
    );

    if (existingResult.rows.length > 0) {
      if (existingResult.rows[0].check_in) {
        throw new Error('Employee already checked in today');
      }
      
      // If the record exists but check_in is null (e.g., from scheduler marking as absent), update it
      const result = await db.query(
        `UPDATE attendance 
         SET check_in = CURRENT_TIME, status = 'Present'
         WHERE employee_id = $1 AND date = CURRENT_DATE
         RETURNING *`,
        [employeeId]
      );
      return result.rows[0];
    }

    // Create new attendance record
    const result = await db.query(
      `INSERT INTO attendance (employee_id, date, check_in, status)
       VALUES ($1, CURRENT_DATE, CURRENT_TIME, 'Present')
       RETURNING *`,
      [employeeId]
    );
    return result.rows[0];
  }

  static async checkOut(employeeId) {
    // Find today's attendance record
    const existingResult = await db.query(
      `SELECT * FROM attendance 
       WHERE employee_id = $1 AND date = CURRENT_DATE`,
      [employeeId]
    );

    if (existingResult.rows.length === 0) {
      throw new Error('No attendance record found for today');
    }

    if (existingResult.rows[0].check_out) {
      throw new Error('Employee already checked out today');
    }

    // Update check-out time
    const result = await db.query(
      `UPDATE attendance 
       SET check_out = CURRENT_TIME 
       WHERE employee_id = $1 AND date = CURRENT_DATE
       RETURNING *`,
      [employeeId]
    );
    return result.rows[0];
  }

  static async todayAttendance({ page = 1, limit = 10, search = '' } = {}) {
    const offset = (page - 1) * limit;
    const searchParam = `%${search}%`;

    const countQuery = await db.query(`
      SELECT COUNT(*) 
      FROM employees
      WHERE employees.first_name ILIKE $1 OR employees.last_name ILIKE $1 OR employees.matricule ILIKE $1
    `, [searchParam]);
    const total = parseInt(countQuery.rows[0].count, 10);

    const result = await db.query(`
      SELECT
        employees.id AS employee_id,
        employees.matricule,
        employees.first_name,
        employees.last_name,
        attendance.check_in,
        attendance.check_out,
        attendance.status
      FROM employees
      LEFT JOIN attendance ON employees.id = attendance.employee_id AND attendance.date = CURRENT_DATE
      WHERE employees.first_name ILIKE $1 OR employees.last_name ILIKE $1 OR employees.matricule ILIKE $1
      ORDER BY employees.last_name, employees.first_name
      LIMIT $2 OFFSET $3
    `, [searchParam, limit, offset]);

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getAnomalies({ page = 1, limit = 10, search = '' } = {}) {
    const offset = (page - 1) * limit;
    const searchParam = `%${search}%`;

    // Anomalies are: 
    // - status = 'Absent' or 'Late'
    // - OR check_in is NOT NULL but check_out IS NULL and date < CURRENT_DATE
    const countQuery = await db.query(`
      SELECT COUNT(*)
      FROM attendance
      JOIN employees ON attendance.employee_id = employees.id
      WHERE (attendance.status IN ('Absent', 'Late')
         OR (attendance.check_in IS NOT NULL AND attendance.check_out IS NULL AND attendance.date < CURRENT_DATE))
         AND (employees.first_name ILIKE $1 OR employees.last_name ILIKE $1 OR employees.matricule ILIKE $1)
    `, [searchParam]);
    const total = parseInt(countQuery.rows[0].count, 10);

    const result = await db.query(`
      SELECT
        attendance.id,
        employees.id AS employee_id,
        employees.matricule,
        employees.first_name,
        employees.last_name,
        attendance.date,
        attendance.check_in,
        attendance.check_out,
        attendance.status,
        attendance.validation_status,
        attendance.justification_reason,
        CASE
          WHEN attendance.status = 'Absent' THEN 'Absent'
          WHEN attendance.status = 'Late' THEN 'Late'
          WHEN attendance.check_in IS NOT NULL AND attendance.check_out IS NULL AND attendance.date < CURRENT_DATE THEN 'Missing Check-out'
          ELSE 'Unknown'
        END AS anomaly_type
      FROM attendance
      JOIN employees ON attendance.employee_id = employees.id
      WHERE (attendance.status IN ('Absent', 'Late')
         OR (attendance.check_in IS NOT NULL AND attendance.check_out IS NULL AND attendance.date < CURRENT_DATE))
         AND (employees.first_name ILIKE $1 OR employees.last_name ILIKE $1 OR employees.matricule ILIKE $1)
      ORDER BY attendance.date DESC, employees.last_name
      LIMIT $2 OFFSET $3
    `, [searchParam, limit, offset]);

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async validateAnomaly(id, validationStatus, justificationReason) {
    const result = await db.query(
      `UPDATE attendance
       SET validation_status = $1, justification_reason = $2
       WHERE id = $3
       RETURNING *`,
      [validationStatus, justificationReason, id]
    );
    return result.rows[0];
  }
}

module.exports = Attendance;
