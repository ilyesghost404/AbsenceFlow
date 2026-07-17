const express = require("express");
const router = express.Router();
const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require("../controllers/departmentController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// All department routes require authentication
router.use(requireAuth);

// Get all departments (manager and employee can view)
router.get("/", authorizeRoles('manager', 'employee'), getDepartments);
router.get("/:id", authorizeRoles('manager', 'employee'), getDepartmentById);

// Create, update, delete require manager role
router.post("/", authorizeRoles('manager'), createDepartment);
router.put("/:id", authorizeRoles('manager'), updateDepartment);
router.delete("/:id", authorizeRoles('manager'), deleteDepartment);

module.exports = router;
