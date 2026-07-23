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
  if (req.user.role === "manager") {
    return next();
  }
  if (req.user.role === "employee" && req.user.employee_id === parseInt(employeeId, 10)) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Access forbidden: you can only access or modify your own records" });
};

// Manager only helper
const requireManager = [requireAuth, authorizeRoles("manager")];

// Manager endpoints
router.get("/anomalies", requireManager, getAnomalies);
router.put("/anomalies/:id/validate", requireManager, validateAnomaly);
router.get("/", requireManager, getAttendance);
router.get("/today", requireManager, getTodayAttendance);
router.get("/:id", requireManager, getAttendanceById);
router.post("/", requireManager, createAttendance);
router.put("/:id", requireManager, updateAttendance);
router.delete("/:id", requireManager, deleteAttendance);

const rateLimit = require("express-rate-limit");

const faceVerificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many face verification attempts. Please wait a minute before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI Face & QR Code verification routes
router.post("/verify-face", requireAuth, faceVerificationLimiter, verifyFace);
router.post("/create-qr", requireAuth, authorizeRoles("manager"), createQr);
router.post("/verify-qr", requireAuth, verifyQr);
router.post("/check-in", requireAuth, checkInWithAI);
router.post("/check-out", requireAuth, checkOutWithAI);

// Self-access or Manager/Admin endpoints
router.post("/check-in/:employeeId", requireAuth, canAccessOrModifySelf, checkIn);
router.put("/check-out/:employeeId", requireAuth, canAccessOrModifySelf, checkOut);
router.get("/:employeeId/:year/:month", requireAuth, canAccessOrModifySelf, getEmployeeAttendanceByMonth);

module.exports = router;

