const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getNotifications,
  updateNotifications,
  getAppearance,
  updateAppearance,
  getSecurityInfo,
  changePassword,
} = require("../controllers/settingsController");
const { requireAuth } = require("../middleware/authMiddleware");

// All settings routes require authentication — users can only modify their own
router.use(requireAuth);

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Notifications
router.get("/notifications", getNotifications);
router.put("/notifications", updateNotifications);

// Appearance
router.get("/appearance", getAppearance);
router.put("/appearance", updateAppearance);

// Security
router.get("/security", getSecurityInfo);
router.put("/password", changePassword);

module.exports = router;
