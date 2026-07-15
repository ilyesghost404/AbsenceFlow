const db = require("../config/database");

/**
 * Normalize a date value (string or Date) to a 'YYYY-MM-DD' string.
 */
function toDateString(val) {
    if (!val) return '';
    if (typeof val === 'string') return val.split('T')[0];
    if (val instanceof Date) {
        const year = val.getFullYear();
        const month = String(val.getMonth() + 1).padStart(2, '0');
        const day = String(val.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return String(val);
}

function countWorkingDays(startDate, endDate, holidays) {
    let workingDays = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Convert holidays to set of strings for quick lookups
    const holidaySet = new Set(holidays.map(h => toDateString(h)));
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        // Check if it's not Saturday (6) or Sunday (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            const dateString = toDateString(d);
            // Check if it's not a holiday
            if (!holidaySet.has(dateString)) {
                workingDays++;
            }
        }
    }
    
    return workingDays;
}

async function getHolidays(startDate, endDate) {
    const result = await db.query(
        "SELECT holiday_date FROM holidays WHERE holiday_date BETWEEN $1 AND $2",
        [startDate, endDate]
    );
    return result.rows.map(row => row.holiday_date);
}

async function getValidatedAbsenceDays(employeeId, startDate, endDate) {
    const result = await db.query(
        `SELECT start_date, end_date 
         FROM absences 
         WHERE employee_id = $1 
         AND status = 'Validated'
         AND start_date <= $3 
         AND end_date >= $2`,
        [employeeId, startDate, endDate]
    );
    
    let absenceDays = 0;
    const holidays = await getHolidays(startDate, endDate);
    const holidaySet = new Set(holidays.map(h => toDateString(h)));
    
    for (const absence of result.rows) {
        const absStart = new Date(Math.max(new Date(absence.start_date), new Date(startDate)));
        const absEnd = new Date(Math.min(new Date(absence.end_date), new Date(endDate)));
        
        for (let d = new Date(absStart); d <= absEnd; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                const dateString = toDateString(d);
                if (!holidaySet.has(dateString)) {
                    absenceDays++;
                }
            }
        }
    }
    
    return absenceDays;
}

async function calculateAttendance(employeeId, startDate, endDate) {
    const holidays = await getHolidays(startDate, endDate);
    const workingDays = countWorkingDays(startDate, endDate, holidays);
    const absenceDays = await getValidatedAbsenceDays(employeeId, startDate, endDate);
    const workedDays = workingDays - absenceDays;
    const attendanceRate = workingDays > 0 ? parseFloat(((workedDays / workingDays) * 100).toFixed(2)) : 0;
    
    return {
        workingDays,
        absenceDays,
        workedDays,
        attendanceRate
    };
}

module.exports = {
    toDateString,
    countWorkingDays,
    getHolidays,
    getValidatedAbsenceDays,
    calculateAttendance
};
