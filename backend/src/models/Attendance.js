const db = require("../config/database");

class Attendance {
  static async getAll() {
    const result = await db.query(`
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
      FROM attendance
      JOIN employees ON attendance.employee_id = employees.id
      ORDER BY attendance.date DESC, attendance.created_at DESC
    `);
    return result.rows;
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
      throw new Error('Employee already checked in today');
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

  static async todayAttendance() {
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
      ORDER BY employees.last_name, employees.first_name
    `);
    return result.rows;
  }
}

module.exports = Attendance;
