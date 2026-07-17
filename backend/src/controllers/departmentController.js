const Department = require("../models/Department");

const getDepartments = async (req, res) => {
    try {
        const departments = await Department.getAll();
        res.status(200).json({ success: true, data: departments });
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({ success: false, message: "Error fetching departments", error: error.message });
    }
};

const getDepartmentById = async (req, res) => {
    try {
        const department = await Department.getById(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }
        res.status(200).json({ success: true, data: department });
    } catch (error) {
        console.error("Error fetching department:", error);
        res.status(500).json({ success: false, message: "Error fetching department", error: error.message });
    }
};

const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Department name is required" });
        }
        const newDepartment = await Department.create({ name, description });
        res.status(201).json({ success: true, data: newDepartment, message: "Department created successfully" });
    } catch (error) {
        console.error("Error creating department:", error);
        if (error.code === '23505') { // PostgreSQL unique violation code
            return res.status(400).json({ success: false, message: "Department name already exists" });
        }
        res.status(500).json({ success: false, message: "Error creating department", error: error.message });
    }
};

const updateDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Department name is required" });
        }
        const updatedDepartment = await Department.update(req.params.id, { name, description });
        if (!updatedDepartment) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }
        res.status(200).json({ success: true, data: updatedDepartment, message: "Department updated successfully" });
    } catch (error) {
        console.error("Error updating department:", error);
        if (error.code === '23505') { // PostgreSQL unique violation code
            return res.status(400).json({ success: false, message: "Department name already exists" });
        }
        res.status(500).json({ success: false, message: "Error updating department", error: error.message });
    }
};

const deleteDepartment = async (req, res) => {
    try {
        const deletedDepartment = await Department.delete(req.params.id);
        if (!deletedDepartment) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }
        res.status(200).json({ success: true, message: "Department deleted successfully" });
    } catch (error) {
        console.error("Error deleting department:", error);
        res.status(500).json({ success: false, message: "Error deleting department", error: error.message });
    }
};

module.exports = {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
};
