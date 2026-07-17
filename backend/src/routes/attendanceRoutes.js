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
  validateAnomaly,
  getEmployeeAttendanceByMonth,
  verifyFace,
  createQr,
  verifyQr,
  checkInWithAI,
  checkOutWithAI
} = require("../controllers/attendanceController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// Helper middleware to check if user can access/modify their own employee data
const canAccessOrModifySelf = (req, res, next) => {
  const { employeeId } = req.params;
  if (req.user.role === "admin" || req.user.role === "manager") {
    return next();
  }
  if (req.user.role === "employee" && req.user.employee_id === parseInt(employeeId, 10)) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Access forbidden: you can only access or modify your own records" });
};

// Manager or Admin only helper
const requireManagerOrAdmin = [requireAuth, authorizeRoles("admin", "manager")];

// Manager/Admin endpoints
router.get("/anomalies", requireManagerOrAdmin, getAnomalies);
router.put("/anomalies/:id/validate", requireManagerOrAdmin, validateAnomaly);
router.get("/", requireManagerOrAdmin, getAttendance);
router.get("/today", requireManagerOrAdmin, getTodayAttendance);
router.get("/:id", requireManagerOrAdmin, getAttendanceById);
router.post("/", requireManagerOrAdmin, createAttendance);
router.put("/:id", requireManagerOrAdmin, updateAttendance);
router.delete("/:id", requireManagerOrAdmin, deleteAttendance);

// AI Face & QR Code verification routes
router.post("/verify-face", requireAuth, verifyFace);
router.post("/create-qr", requireAuth, authorizeRoles("admin", "manager"), createQr);
router.post("/verify-qr", requireAuth, verifyQr);
router.post("/check-in", requireAuth, checkInWithAI);
router.post("/check-out", requireAuth, checkOutWithAI);

// Self-access or Manager/Admin endpoints
router.post("/check-in/:employeeId", requireAuth, canAccessOrModifySelf, checkIn);
router.put("/check-out/:employeeId", requireAuth, canAccessOrModifySelf, checkOut);
router.get("/:employeeId/:year/:month", requireAuth, canAccessOrModifySelf, getEmployeeAttendanceByMonth);

module.exports = router;

