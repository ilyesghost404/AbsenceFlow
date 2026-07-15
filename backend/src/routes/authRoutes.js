const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  verifyResetCode,
  resetPassword
} = require("../controllers/authController");

// Public endpoints under /api/auth
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

module.exports = router;
