const express = require("express");
const router = express.Router();
const { 
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
  verifyEmail,
  update2FA,
  getGlobalAuditLogs,
  adminLockUser,
  adminRevokeUserSessions,
  getMe, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  activateAccount,
  verifyActivationToken
} = require("../controllers/userController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// Public authentication routes
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/activate-account", activateAccount);
router.get("/activate-account/verify", verifyActivationToken);
router.post("/verify-email", verifyEmail);

// Authenticated user profile routes
router.get("/me", requireAuth, getMe);
router.post("/change-password", requireAuth, changePassword);

// Session management routes
router.get("/sessions", requireAuth, getActiveSessions);
router.delete("/sessions/all", requireAuth, revokeAllSessions);
router.delete("/sessions/:sessionId", requireAuth, revokeSession);

// Security settings routes
router.post("/2fa", requireAuth, update2FA);
router.get("/login-history", requireAuth, getLoginHistory);

// Admin-only user management routes
router.get("/", requireAuth, authorizeRoles("admin"), getUsers);
router.post("/", requireAuth, authorizeRoles("admin"), createUser);
router.put("/:id", requireAuth, authorizeRoles("admin"), updateUser);
router.delete("/:id", requireAuth, authorizeRoles("admin"), deleteUser);

// Admin security center routes
router.get("/audit-logs", requireAuth, authorizeRoles("admin"), getGlobalAuditLogs);
router.post("/:id/lock", requireAuth, authorizeRoles("admin"), adminLockUser);
router.delete("/:id/sessions", requireAuth, authorizeRoles("admin"), adminRevokeUserSessions);

module.exports = router;
