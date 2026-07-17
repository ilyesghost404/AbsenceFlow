const express = require("express");
const router = express.Router();
const {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    registerFace
} = require("../controllers/employeeController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// Helper middleware to check if employee can view this profile
const canViewEmployee = (req, res, next) => {
  if (req.user.role === "manager") {
    return next();
  }
  if (req.user.role === "employee" && req.user.employee_id === parseInt(req.params.id)) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Access forbidden: you can only view your own profile" });
};

router.get("/", requireAuth, authorizeRoles("admin", "manager"), getEmployees);
router.get("/:id", requireAuth, canViewEmployee, getEmployeeById);
router.post("/", requireAuth, authorizeRoles("manager"), createEmployee);
router.put("/:id", requireAuth, authorizeRoles("manager"), updateEmployee);
router.delete("/:id", requireAuth, authorizeRoles("manager"), deleteEmployee);
router.post("/:id/register-face", requireAuth, authorizeRoles("manager"), registerFace);

module.exports = router;

