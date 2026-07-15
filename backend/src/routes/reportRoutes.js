const express = require("express");
const router = express.Router();
const {
    getReportStats,
    getMonthlyAbsenceEvolution,
    getDepartmentStats,
    getAbsenceTypes,
    getEmployeeRanking,
    getDetailedAbsences,
    exportToExcel,
    getMonthlyReport,
    getAttendanceMatrix
} = require("../controllers/reportController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// All report routes require authentication and are restricted to admin or manager roles
router.use(requireAuth, authorizeRoles("admin", "manager"));

router.get("/statistics", getReportStats);
router.get("/monthly-evolution", getMonthlyAbsenceEvolution);
router.get("/departments", getDepartmentStats);
router.get("/types", getAbsenceTypes);
router.get("/ranking", getEmployeeRanking);
router.get("/detailed", getDetailedAbsences);
router.get("/attendance-matrix", getAttendanceMatrix);
router.get("/export/excel", exportToExcel);
router.get("/:year/:month", getMonthlyReport);

module.exports = router;

