const Employee = require("../models/Employee");

const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.getAll();
        res.json({ success: true, data: employees });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch employees" });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.getById(id);
        
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        
        res.json({ success: true, data: employee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch employee" });
    }
};

const createEmployee = async (req, res) => {
    try {
        const { matricule, first_name, last_name, hire_date } = req.body;
        
        if (!matricule || !first_name || !last_name || !hire_date) {
            return res.status(400).json({ 
                success: false, 
                message: "Matricule, first name, last name, and hire date are required" 
            });
        }
        
        const employee = await Employee.create(req.body);
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        console.error(error);
        
        if (error.code === "23505") {
            return res.status(400).json({ success: false, message: "Matricule or email already exists" });
        }
        
        res.status(500).json({ success: false, message: "Failed to create employee" });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { matricule, first_name, last_name, hire_date } = req.body;
        
        if (!matricule || !first_name || !last_name || !hire_date) {
            return res.status(400).json({ 
                success: false, 
                message: "Matricule, first name, last name, and hire date are required" 
            });
        }
        
        const employee = await Employee.update(id, req.body);
        
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        
        res.json({ success: true, data: employee });
    } catch (error) {
        console.error(error);
        
        if (error.code === "23505") {
            return res.status(400).json({ success: false, message: "Matricule or email already exists" });
        }
        
        res.status(500).json({ success: false, message: "Failed to update employee" });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.delete(id);
        
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        
        res.json({ success: true, data: employee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete employee" });
    }
};

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee
};
