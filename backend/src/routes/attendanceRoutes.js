const express = require("express");
const router = express.Router();
const {
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  checkIn,
  checkOut,
  getTodayAttendance,
  getAnomalies,
  validateAnomaly
} = require("../controllers/attendanceController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// All attendance routes require authentication and are restricted to admin or manager roles
router.use(requireAuth, authorizeRoles("admin", "manager"));

router.get("/anomalies", getAnomalies);
router.put("/anomalies/:id/validate", validateAnomaly);

router.get("/", getAttendance);
router.get("/today", getTodayAttendance);
router.get("/:id", getAttendanceById);
router.post("/", createAttendance);
router.post("/check-in/:employeeId", checkIn);
router.put("/:id", updateAttendance);
router.put("/check-out/:employeeId", checkOut);
router.delete("/:id", deleteAttendance);

module.exports = router;

