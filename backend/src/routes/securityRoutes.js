const express = require("express");
const router = express.Router();
const {
  registerFace,
  getFaceStatus,
  updateFace,
  verifyCurrentFace
} = require("../controllers/securityController");
const { requireAuth } = require("../middleware/authMiddleware");

// Route configuration with activation token bypass check
router.post("/register-face", (req, res, next) => {
  if (req.body.token) {
    return next();
  }
  return requireAuth(req, res, next);
}, registerFace);

router.get("/face-status/:employeeId", requireAuth, getFaceStatus);
router.post("/verify-face", requireAuth, verifyCurrentFace);
router.put("/update-face", requireAuth, updateFace);

module.exports = router;
