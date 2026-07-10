const db = require("../config/database");

class Absence {
    static async getAll() {
        const result = await db.query(`
            SELECT 
                absences.*,
                CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name,
                employees.matricule,
                employees.department
            FROM absences
            JOIN employees ON absences.employee_id = employees.id
            ORDER BY absences.created_at DESC
        `);
        return result.rows;
    }

    static async getByDate(date) {
        const result = await db.query(`
            SELECT 
                absences.*,
                CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name,
                employees.matricule,
                employees.department
            FROM absences
            JOIN employees ON absences.employee_id = employees.id
            WHERE $1 BETWEEN absences.start_date AND absences.end_date
            ORDER BY absences.created_at DESC
        `, [date]);
        return result.rows;
    }

    static async getById(id) {
        const result = await db.query(`
            SELECT 
                absences.*,
                CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name
            FROM absences
            JOIN employees ON absences.employee_id = employees.id
            WHERE absences.id = $1
        `, [id]);
        return result.rows[0];
    }

    static async create(absence) {
        const { employee_id, type, start_date, end_date, reason } = absence;
        const result = await db.query(
            `INSERT INTO absences (employee_id, type, start_date, end_date, reason) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [employee_id, type, start_date, end_date, reason]
        );
        return result.rows[0];
    }

    static async update(id, absence) {
        const { employee_id, type, start_date, end_date, reason, status } = absence;
        const result = await db.query(
            `UPDATE absences 
             SET employee_id = $1, type = $2, start_date = $3, end_date = $4, reason = $5, status = $6
             WHERE id = $7 
             RETURNING *`,
            [employee_id, type, start_date, end_date, reason, status, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query("DELETE FROM absences WHERE id = $1 RETURNING *", [id]);
        return result.rows[0];
    }

    static async validate(id) {
        const result = await db.query(
            `UPDATE absences 
             SET status = 'Validated', validated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    static async reject(id) {
        const result = await db.query(
            `UPDATE absences 
             SET status = 'Rejected', validated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    static async getByEmployeeId(employeeId) {
        const result = await db.query(`
            SELECT 
                absences.*,
                CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name,
                employees.matricule,
                employees.department
            FROM absences
            JOIN employees ON absences.employee_id = employees.id
            WHERE absences.employee_id = $1
            ORDER BY absences.created_at DESC
        `, [employeeId]);
        return result.rows;
    }
}

module.exports = Absence;

