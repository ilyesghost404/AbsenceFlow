const express = require("express");
const router = express.Router();
const { 
  login, 
  getMe, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} = require("../controllers/userController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// Public authentication routes
router.post("/login", login);

// Authenticated user profile routes
router.get("/me", requireAuth, getMe);

// Admin-only user management routes
router.get("/", requireAuth, authorizeRoles("admin"), getUsers);
router.post("/", requireAuth, authorizeRoles("admin"), createUser);
router.put("/:id", requireAuth, authorizeRoles("admin"), updateUser);
router.delete("/:id", requireAuth, authorizeRoles("admin"), deleteUser);

module.exports = router;
