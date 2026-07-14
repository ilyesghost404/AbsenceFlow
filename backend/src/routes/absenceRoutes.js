const express = require("express");
const router = express.Router();
const {
    getAbsences,
    getAbsenceById,
    getAbsencesByDate,
    createAbsence,
    updateAbsence,
    deleteAbsence,
    validateAbsence,
    rejectAbsence
} = require("../controllers/absenceController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(requireAuth);

router.get("/", getAbsences);
router.get("/date/:date", authorizeRoles("admin", "manager"), getAbsencesByDate);
router.get("/:id", getAbsenceById);
router.post("/", createAbsence);
router.put("/:id", authorizeRoles("admin", "manager"), updateAbsence);
router.delete("/:id", authorizeRoles("admin", "manager"), deleteAbsence);
router.put("/:id/validate", authorizeRoles("admin", "manager"), validateAbsence);
router.put("/:id/reject", authorizeRoles("admin", "manager"), rejectAbsence);

module.exports = router;

