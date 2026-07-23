const db = require("../config/database");

/**
 * Normalize a date value (string or Date) to a 'YYYY-MM-DD' string.
 */
function parseLocalDate(val) {
    if (!val) return new Date();
    if (val instanceof Date) {
        return new Date(val.getFullYear(), val.getMonth(), val.getDate());
    }
    const str = String(val).split('T')[0];
    const parts = str.split('-').map(Number);
    if (parts.length >= 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(val);
}

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
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    
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
    const startStr = toDateString(startDate);
    const endStr = toDateString(endDate);
    const result = await db.query(
        "SELECT holiday_date FROM holidays WHERE holiday_date BETWEEN $1 AND $2",
        [startStr, endStr]
    );
    return result.rows.map(row => row.holiday_date);
}

async function getValidatedAbsenceDays(employeeId, startDate, endDate) {
    const startStr = toDateString(startDate);
    const endStr = toDateString(endDate);
    
    const result = await db.query(
        `SELECT start_date, end_date 
         FROM absences 
         WHERE employee_id = $1 
         AND status = 'Validated'
         AND start_date <= $3 
         AND end_date >= $2`,
        [employeeId, startStr, endStr]
    );
    
    let absenceDays = 0;
    const holidays = await getHolidays(startStr, endStr);
    const holidaySet = new Set(holidays.map(h => toDateString(h)));
    
    for (const absence of result.rows) {
        const aStart = parseLocalDate(absence.start_date);
        const aEnd = parseLocalDate(absence.end_date);
        const rangeStart = parseLocalDate(startStr);
        const rangeEnd = parseLocalDate(endStr);

        const absStart = new Date(Math.max(aStart.getTime(), rangeStart.getTime()));
        const absEnd = new Date(Math.min(aEnd.getTime(), rangeEnd.getTime()));
        
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
    const startStr = toDateString(startDate);
    const endStr = toDateString(endDate);
    const holidays = await getHolidays(startStr, endStr);
    const workingDays = countWorkingDays(startStr, endStr, holidays);
    const absenceDays = await getValidatedAbsenceDays(employeeId, startStr, endStr);
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
