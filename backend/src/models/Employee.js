const db = require("../config/database");

class Employee {
    static async getAll() {
        const result = await db.query("SELECT * FROM employees ORDER BY created_at DESC");
        return result.rows;
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
