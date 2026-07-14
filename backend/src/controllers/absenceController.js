const Absence = require("../models/Absence");
const { getHolidays, countWorkingDays } = require("../services/attendanceService");

/**
 * Calculate the number of chargeable days for an absence period,
 * excluding holidays and weekends.
 */
async function calculateAbsenceWorkingDays(start_date, end_date) {
    const holidays = await getHolidays(start_date, end_date);
    const chargeableDays = countWorkingDays(start_date, end_date, holidays);
    const totalCalendarDays = Math.round(
        (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)
    ) + 1;
    const holidayCount = holidays.filter(h => {
        const d = new Date(h);
        return d.getDay() !== 0 && d.getDay() !== 6;
    }).length;

    return { chargeableDays, totalCalendarDays, holidayCount, holidays };
}

const getAbsences = async (req, res) => {
    try {
        const { page, limit, search, source } = req.query;
        const params = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            search: search || '',
            source: source || undefined
        };

        let result;
        if (req.user.role === "employee") {
            if (!req.user.employee_id) {
                return res.json({ success: true, data: [], page: 1, limit: params.limit, total: 0, totalPages: 0 });
            }
            result = await Absence.getByEmployeeId(req.user.employee_id, params);
        } else {
            result = await Absence.getAll(params);
        }
        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Error in getAbsences:", error);
        res.status(500).json({ success: false, message: "Failed to fetch absences" });
    }
};

const getAbsencesByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const absences = await Absence.getByDate(date);
        res.json({ success: true, data: absences });
    } catch (error) {
        console.error("Error in getAbsencesByDate:", error);
        res.status(500).json({ success: false, message: "Failed to fetch absences by date" });
    }
};

const getAbsenceById = async (req, res) => {
    try {
        const { id } = req.params;
        const absence = await Absence.getById(id);
        
        if (!absence) {
            return res.status(404).json({ success: false, message: "Absence not found" });
        }

        // Restrict employee users to viewing only their own absences
        if (req.user.role === "employee" && absence.employee_id !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: "Access forbidden: cannot view other employees' absences" });
        }
        
        res.json({ success: true, data: absence });
    } catch (error) {
        console.error("Error in getAbsenceById:", error);
        res.status(500).json({ success: false, message: "Failed to fetch absence" });
    }
};

const createAbsence = async (req, res) => {
    try {
        const { employee_id, type, start_date, end_date } = req.body;
        
        let targetEmployeeId = employee_id;
        // Restrict employee users to requesting absences only for themselves
        if (req.user.role === "employee") {
            targetEmployeeId = req.user.employee_id;
        }

        if (!targetEmployeeId || !type || !start_date || !end_date) {
            return res.status(400).json({ 
                success: false, 
                message: "Employee ID, type, start date, and end date are required" 
            });
        }

        // Holiday validation
        const { chargeableDays, holidayCount } = await calculateAbsenceWorkingDays(start_date, end_date);

        if (chargeableDays === 0) {
            return res.status(400).json({
                success: false,
                message: "The selected period contains only holidays or weekends. No absence will be recorded."
            });
        }

        const absence = await Absence.create({
            ...req.body,
            employee_id: targetEmployeeId,
            source: 'employee_request'
        });

        const responseMessage = holidayCount > 0
            ? `Absence created. Note: ${holidayCount} holiday day(s) in this period are excluded from the count. Chargeable days: ${chargeableDays}.`
            : null;

        res.status(201).json({ 
            success: true, 
            data: { ...absence, chargeable_days: chargeableDays, holidays_excluded: holidayCount },
            message: responseMessage
        });
    } catch (error) {
        console.error("Error in createAbsence:", error);
        
        if (error.code === "23503") {
            return res.status(400).json({ success: false, message: "Employee not found" });
        }
        
        if (error.code === "23514") {
            return res.status(400).json({ success: false, message: "Invalid absence type, status, or dates" });
        }
        
        res.status(500).json({ success: false, message: "Failed to create absence" });
    }
};

const updateAbsence = async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id, type, start_date, end_date } = req.body;
        
        if (!employee_id || !type || !start_date || !end_date) {
            return res.status(400).json({ 
                success: false, 
                message: "Employee ID, type, start date, and end date are required" 
            });
        }

        // Holiday validation
        const { chargeableDays, holidayCount } = await calculateAbsenceWorkingDays(start_date, end_date);

        if (chargeableDays === 0) {
            return res.status(400).json({
                success: false,
                message: "The selected period contains only holidays or weekends. No absence will be recorded."
            });
        }
        
        const absence = await Absence.update(id, req.body);
        
        if (!absence) {
            return res.status(404).json({ success: false, message: "Absence not found" });
        }

        const responseMessage = holidayCount > 0
            ? `Absence updated. Note: ${holidayCount} holiday day(s) in this period are excluded from the count. Chargeable days: ${chargeableDays}.`
            : null;
        
        res.json({ 
            success: true, 
            data: { ...absence, chargeable_days: chargeableDays, holidays_excluded: holidayCount },
            message: responseMessage
        });
    } catch (error) {
        console.error("Error in updateAbsence:", error);
        
        if (error.code === "23503") {
            return res.status(400).json({ success: false, message: "Employee not found" });
        }
        
        if (error.code === "23514") {
            return res.status(400).json({ success: false, message: "Invalid absence type, status, or dates" });
        }
        
        res.status(500).json({ success: false, message: "Failed to update absence" });
    }
};

const deleteAbsence = async (req, res) => {
    try {
        const { id } = req.params;
        const absence = await Absence.delete(id);
        
        if (!absence) {
            return res.status(404).json({ success: false, message: "Absence not found" });
        }
        
        res.json({ success: true, data: absence });
    } catch (error) {
        console.error("Error in deleteAbsence:", error);
        res.status(500).json({ success: false, message: "Failed to delete absence" });
    }
};

const validateAbsence = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the absence first to check its status and dates
        const existing = await Absence.getById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Absence not found" });
        }

        if (existing.status !== "Pending") {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot validate an absence with status '${existing.status}'. Only pending absences can be validated.` 
            });
        }

        // Holiday validation before validating
        const { chargeableDays } = await calculateAbsenceWorkingDays(existing.start_date, existing.end_date);
        if (chargeableDays === 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot validate: the absence period contains only holidays or weekends."
            });
        }

        const absence = await Absence.validate(id);
        
        res.json({ success: true, data: absence });
    } catch (error) {
        console.error("Error in validateAbsence:", error);
        res.status(500).json({ success: false, message: "Failed to validate absence" });
    }
};

const rejectAbsence = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the absence first to check status
        const existing = await Absence.getById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Absence not found" });
        }

        if (existing.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot reject an absence with status '${existing.status}'. Only pending absences can be rejected.`
            });
        }

        const absence = await Absence.reject(id);
        
        res.json({ success: true, data: absence });
    } catch (error) {
        console.error("Error in rejectAbsence:", error);
        res.status(500).json({ success: false, message: "Failed to reject absence" });
    }
};

module.exports = {
    getAbsences,
    getAbsenceById,
    getAbsencesByDate,
    createAbsence,
    updateAbsence,
    deleteAbsence,
    validateAbsence,
    rejectAbsence
};
