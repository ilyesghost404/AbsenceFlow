
const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAdminDashboardStats,
  getAdminDashboardSearch,
  getSystemHealth
} = require("../controllers/dashboardController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// ── Legacy dashboard (employee / manager / admin shared) ──────────────────────
router.get("/", requireAuth, getDashboardStats);

// ── Admin-specific dashboard ──────────────────────────────────────────────────
router.get("/admin",        requireAuth, authorizeRoles("admin"), getAdminDashboardStats);
router.get("/admin/search", requireAuth, authorizeRoles("admin"), getAdminDashboardSearch);

// ── System health (admin only) ────────────────────────────────────────────────
router.get("/health", requireAuth, authorizeRoles("admin"), getSystemHealth);

module.exports = router;
