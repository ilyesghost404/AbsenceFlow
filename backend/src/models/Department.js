const db = require("../config/database");

class Department {
    static async getAll() {
        const query = `
            SELECT d.*, COUNT(e.id)::int as employee_count 
            FROM departments d
            LEFT JOIN employees e ON d.id = e.department_id
            GROUP BY d.id
            ORDER BY d.name ASC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    static async getById(id) {
        const query = `
            SELECT d.*, COUNT(e.id)::int as employee_count 
            FROM departments d
            LEFT JOIN employees e ON d.id = e.department_id
            WHERE d.id = $1
            GROUP BY d.id
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async create(department) {
        const { name, description } = department;
        const result = await db.query(
            "INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
        );
        return result.rows[0];
    }

    static async update(id, department) {
        const { name, description } = department;
        const result = await db.query(
            "UPDATE departments SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
            [name, description, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        // Employees assigned to this department will have their department_id set to NULL automatically due to ON DELETE SET NULL
        const result = await db.query("DELETE FROM departments WHERE id = $1 RETURNING *", [id]);
        return result.rows[0];
    }
}

module.exports = Department;
