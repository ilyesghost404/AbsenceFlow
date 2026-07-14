const db = require("../config/database");

class Employee {
    static async getAll(params = {}) {
        const { page = 1, limit = 10, search = '' } = params;
        const offset = (page - 1) * limit;

        let baseQuery = "FROM employees";
        let countQuery = `SELECT COUNT(*) ${baseQuery}`;
        let dataQuery = `SELECT * ${baseQuery}`;
        const queryParams = [];
        let whereClause = '';

        if (search) {
            whereClause = ` WHERE matricule ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR department ILIKE $1`;
            queryParams.push(`%${search}%`);
            dataQuery += whereClause;
            countQuery += whereClause;
        }

        dataQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

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
        const result = await db.query("SELECT * FROM employees WHERE id = $1", [id]);
        return result.rows[0];
    }

    static async create(employee) {
        const { matricule, first_name, last_name, email, phone, department, position, hire_date } = employee;
        const result = await db.query(
            "INSERT INTO employees (matricule, first_name, last_name, email, phone, department, position, hire_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [matricule, first_name, last_name, email, phone, department, position, hire_date]
        );
        return result.rows[0];
    }

    static async update(id, employee) {
        const { matricule, first_name, last_name, email, phone, department, position, hire_date } = employee;
        const result = await db.query(
            "UPDATE employees SET matricule = $1, first_name = $2, last_name = $3, email = $4, phone = $5, department = $6, position = $7, hire_date = $8 WHERE id = $9 RETURNING *",
            [matricule, first_name, last_name, email, phone, department, position, hire_date, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query("DELETE FROM employees WHERE id = $1 RETURNING *", [id]);
        return result.rows[0];
    }
}

module.exports = Employee;
