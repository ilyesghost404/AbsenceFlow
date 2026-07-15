const db = require("../config/database");

class Absence {
    static async getAll(params = {}) {
        const { page = 1, limit = 10, search = '', source } = params;
        const offset = (page - 1) * limit;

        let baseQuery = `
            FROM absences
            JOIN employees ON absences.employee_id = employees.id
        `;
        let countQuery = `SELECT COUNT(*) ${baseQuery}`;
        let dataQuery = `
            SELECT 
                absences.*,
                CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name,
                employees.matricule,
                employees.department
            ${baseQuery}
        `;

        const queryParams = [];
        const conditions = [];

        if (source) {
            queryParams.push(source);
            conditions.push(`absences.source = $${queryParams.length}`);
        }

        if (search) {
            queryParams.push(`%${search}%`);
            const searchIdx = queryParams.length;
            conditions.push(`(employees.first_name ILIKE $${searchIdx} 
                OR employees.last_name ILIKE $${searchIdx} 
                OR employees.matricule ILIKE $${searchIdx}
                OR absences.type ILIKE $${searchIdx})`);
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            dataQuery += whereClause;
            countQuery += whereClause;
        }

        dataQuery += ` ORDER BY absences.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

        const countResult = await db.query(countQuery, queryParams);
        const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count, 10),
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit)
        };
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
        const { employee_id, type, start_date, end_date, reason, source = 'employee_request' } = absence;
        const result = await db.query(
            `INSERT INTO absences (employee_id, type, start_date, end_date, reason, source) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [employee_id, type, start_date, end_date, reason, source]
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

    static async getByEmployeeId(employeeId, params = {}) {
        const { page = 1, limit = 10, search = '', source } = params;
        const offset = (page - 1) * limit;

        let baseQuery = `
            FROM absences
            JOIN employees ON absences.employee_id = employees.id
            WHERE absences.employee_id = $1
        `;
        let countQuery = `SELECT COUNT(*) ${baseQuery}`;
        let dataQuery = `
            SELECT 
                absences.*,
                CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name,
                employees.matricule,
                employees.department
            ${baseQuery}
        `;

        const queryParams = [employeeId];

        if (source) {
            queryParams.push(source);
            const sourceFilter = ` AND absences.source = $${queryParams.length}`;
            dataQuery += sourceFilter;
            countQuery += sourceFilter;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            const searchFilter = ` AND absences.type ILIKE $${queryParams.length}`;
            dataQuery += searchFilter;
            countQuery += searchFilter;
        }

        dataQuery += ` ORDER BY absences.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

        const countResult = await db.query(countQuery, queryParams);
        const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count, 10),
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit)
        };
    }

    static async checkOverlap(employeeId, startDate, endDate, excludeAbsenceId = null) {
        let query = `
            SELECT * FROM absences
            WHERE employee_id = $1
              AND status != 'Rejected'
              AND start_date <= $2
              AND end_date >= $3
        `;
        const params = [employeeId, endDate, startDate];
        if (excludeAbsenceId) {
            query += ` AND id != $4`;
            params.push(excludeAbsenceId);
        }
        const result = await db.query(query, params);
        return result.rows.length > 0;
    }
}

module.exports = Absence;

