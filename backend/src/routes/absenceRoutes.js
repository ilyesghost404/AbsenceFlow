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
router.get("/date/:date", authorizeRoles("manager"), getAbsencesByDate);
router.get("/:id", getAbsenceById);
router.post("/", createAbsence);
router.put("/:id", authorizeRoles("manager"), updateAbsence);
router.delete("/:id", authorizeRoles("manager"), deleteAbsence);
router.put("/:id/validate", authorizeRoles("manager"), validateAbsence);
router.put("/:id/reject", authorizeRoles("manager"), rejectAbsence);

module.exports = router;

