const express = require("express");
const router = express.Router();
const {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday
} = require("../controllers/holidayController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// All holiday routes require authentication
router.use(requireAuth);

router.get("/", getHolidays);
router.get("/:id", getHolidayById);
router.post("/", authorizeRoles("manager"), createHoliday);
router.put("/:id", authorizeRoles("manager"), updateHoliday);
router.delete("/:id", authorizeRoles("manager"), deleteHoliday);

module.exports = router;

