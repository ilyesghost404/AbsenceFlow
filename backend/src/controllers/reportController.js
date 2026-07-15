const db = require("../config/database");
const reportService = require("../services/reportService");
const { getHolidays, countWorkingDays, toDateString } = require("../services/attendanceService");

// Get comprehensive report statistics
const getReportStats = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            department,
            status,
            type
        } = req.query;

        // Build query conditions
        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (startDate) {
            conditions.push(`a.start_date >= $${paramIndex++}`);
            params.push(startDate);
        }
        if (endDate) {
            conditions.push(`a.start_date <= $${paramIndex++}`);
            params.push(endDate);
        }
        if (department) {
            conditions.push(`e.department = $${paramIndex++}`);
            params.push(department);
        }
        if (status) {
            conditions.push(`a.status = $${paramIndex++}`);
            params.push(status);
        }
        if (type) {
            conditions.push(`a.type = $${paramIndex++}`);
            params.push(type);
        }

        const whereClause = conditions.length > 0 
            ? 'WHERE ' + conditions.join(' AND ') 
            : '';

        // Total employees
        const employeesResult = await db.query("SELECT COUNT(*) as count FROM employees");
        const totalEmployees = parseInt(employeesResult.rows[0].count);

        // Total absences with filters
        const absencesQuery = `
            SELECT COUNT(*) as count 
            FROM absences a
            JOIN employees e ON a.employee_id = e.id
            ${whereClause}
        `;
        const absencesResult = await db.query(absencesQuery, params);
        const totalAbsences = parseInt(absencesResult.rows[0].count);

        // Absences this month
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const absencesThisMonthResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM absences 
            WHERE start_date >= $1 AND start_date <= $2
        `, [firstDayOfMonth, lastDayOfMonth]);
        const absencesThisMonth = parseInt(absencesThisMonthResult.rows[0].count);

        // Absence rate
        const absenceRate = totalEmployees > 0 
            ? parseFloat(((totalAbsences / totalEmployees) * 10).toFixed(1)) 
            : 0;

        // Status counts
        const statusCountsResult = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM absences 
            GROUP BY status
        `);
        const statusCounts = {};
        statusCountsResult.rows.forEach(row => {
            statusCounts[row.status] = parseInt(row.count);
        });

        // Holidays this month
        const holidaysThisMonthResult = await db.query(`
            SELECT COUNT(*) FROM holidays 
            WHERE EXTRACT(YEAR FROM holiday_date) = $1 
            AND EXTRACT(MONTH FROM holiday_date) = $2
        `, [currentDate.getFullYear(), currentDate.getMonth() + 1]);
        const holidaysThisMonth = parseInt(holidaysThisMonthResult.rows[0].count);

        res.json({
            success: true,
            data: {
                totalEmployees,
                totalAbsences,
                absencesThisMonth,
                absenceRate,
                pendingRequests: statusCounts.Pending || 0,
                approvedRequests: statusCounts.Validated || 0,
                rejectedRequests: statusCounts.Rejected || 0,
                holidaysThisMonth
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to get report statistics"
        });
    }
};

// Get monthly absence evolution
const getMonthlyAbsenceEvolution = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                TO_CHAR(start_date, 'FMMonth YYYY') as month,
                EXTRACT(YEAR FROM start_date) as year,
                EXTRACT(MONTH FROM start_date) as month_num,
                COUNT(*) as count
            FROM absences
            WHERE start_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY EXTRACT(YEAR FROM start_date), EXTRACT(MONTH FROM start_date), TO_CHAR(start_date, 'FMMonth YYYY')
            ORDER BY year, month_num
        `);
        
        res.json({
            success: true,
            data: result.rows.map(row => ({
                month: row.month,
                count: parseInt(row.count)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to get monthly absence evolution"
        });
    }
};

// Get department statistics
const getDepartmentStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                e.department as name,
                COUNT(a.id) as count,
                ROUND((COUNT(a.id) * 100.0 / (SELECT COUNT(*) FROM employees)), 1) as percentage
            FROM employees e
            LEFT JOIN absences a ON e.id = a.employee_id
            WHERE e.department IS NOT NULL AND e.department != ''
            GROUP BY e.department
            ORDER BY count DESC
        `);
        
        res.json({
            success: true,
            data: result.rows.map(row => ({
                name: row.name,
                absences: parseInt(row.count),
                percentage: parseFloat(row.percentage)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to get department statistics"
        });
    }
};

// Get absence type distribution
const getAbsenceTypes = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                type as name,
                COUNT(*) as count
            FROM absences
            GROUP BY type
            ORDER BY count DESC
        `);
        
        res.json({
            success: true,
            data: result.rows.map(row => ({
                name: row.name,
                value: parseInt(row.count)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to get absence types"
        });
    }
};

// Get employee absence ranking
const getEmployeeRanking = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                CONCAT(e.first_name, ' ', e.last_name) as name,
                e.matricule,
                e.department,
                COUNT(a.id) as count,
                ROUND((COUNT(a.id) * 100.0 / (SELECT COUNT(*) FROM absences)), 1) as percentage
            FROM employees e
            LEFT JOIN absences a ON e.id = a.employee_id
            GROUP BY e.id, e.first_name, e.last_name, e.matricule, e.department
            HAVING COUNT(a.id) > 0
            ORDER BY count DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: result.rows.map(row => ({
                name: row.name,
                matricule: row.matricule,
                department: row.department,
                count: parseInt(row.count),
                percentage: parseFloat(row.percentage)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to get employee ranking"
        });
    }
};

// Get detailed absences for reports table
const getDetailedAbsences = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            startDate,
            endDate,
            department,
            status,
            type
        } = req.query;

        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (search) {
            conditions.push(`(CONCAT(e.first_name, ' ', e.last_name) ILIKE $${paramIndex++} OR e.matricule ILIKE $${paramIndex++})`);
            params.push(`%${search}%`, `%${search}%`);
        }
        if (startDate) {
            conditions.push(`a.start_date >= $${paramIndex++}`);
            params.push(startDate);
        }
        if (endDate) {
            conditions.push(`a.end_date <= $${paramIndex++}`);
            params.push(endDate);
        }
        if (department) {
            conditions.push(`e.department = $${paramIndex++}`);
            params.push(department);
        }
        if (status) {
            conditions.push(`a.status = $${paramIndex++}`);
            params.push(status);
        }
        if (type) {
            conditions.push(`a.type = $${paramIndex++}`);
            params.push(type);
        }

        const whereClause = conditions.length > 0 
            ? 'WHERE ' + conditions.join(' AND ') 
            : '';

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM absences a
            JOIN employees e ON a.employee_id = e.id
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get data
        const dataQuery = `
            SELECT 
                a.id,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                e.matricule,
                e.department,
                a.type,
                a.start_date,
                a.end_date,
                (a.end_date - a.start_date + 1) as duration,
                a.status,
                a.reason
            FROM absences a
            JOIN employees e ON a.employee_id = e.id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        const dataResult = await db.query(dataQuery, [...params, parseInt(limit), offset]);

        // Compute accurate working-day duration for each absence (excluding holidays and weekends)
        const rows = await Promise.all(dataResult.rows.map(async (row) => {
            const startStr = toDateString(row.start_date);
            const endStr = toDateString(row.end_date);
            const holidays = await getHolidays(startStr, endStr);
            const workingDays = countWorkingDays(startStr, endStr, holidays);
            return { ...row, duration: workingDays, holidays_excluded: holidays.filter(h => {
                const d = new Date(h);
                return d.getDay() !== 0 && d.getDay() !== 6;
            }).length };
        }));

        res.json({
            success: true,
            data: rows,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            totalPages: Math.ceil(total / parseInt(limit, 10))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to get detailed absences"
        });
    }
};

// Export to Excel
const exportToExcel = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            department,
            status,
            type,
            year,
            month
        } = req.query;

        let workbook;
        if (year && month) {
            workbook = await reportService.generateMonthlyMatrixReport(year, month);
        } else {
            let queryParams = {
                startDate,
                endDate,
                department,
                status,
                type
            };
            workbook = await reportService.generateCustomReport(queryParams);
        }
        
        const fileName = `AbsenceFlow_Report_${toDateString(new Date())}.xlsx`;
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`
        );
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to export to Excel"
        });
    }
};

const getMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.params;
        
        const parsedYear = parseInt(year);
        const parsedMonth = parseInt(month);
        
        if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
            return res.status(400).json({
                success: false,
                message: "Invalid year or month"
            });
        }
        
        const workbook = await reportService.generateMonthlyReport(parsedYear, parsedMonth);
        
        const fileName = `Attendance_Report_${parsedYear}_${String(parsedMonth).padStart(2, '0')}.xlsx`;
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`
        );
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to generate report"
        });
    }
};

const getAttendanceMatrix = async (req, res) => {
    try {
        const { year, month } = req.query;
        const parsedYear = parseInt(year) || new Date().getFullYear();
        const parsedMonth = parseInt(month) || (new Date().getMonth() + 1);

        const startDate = new Date(parsedYear, parsedMonth - 1, 1);
        const endDate = new Date(parsedYear, parsedMonth, 0);
        const totalDays = endDate.getDate();

        // 1. Fetch all active employees
        const employeesResult = await db.query(
            "SELECT id, matricule, first_name, last_name, department FROM employees ORDER BY matricule"
        );
        const employees = employeesResult.rows;

        // 2. Fetch all holidays in this month range
        const holidaysResult = await db.query(
            "SELECT holiday_date, name FROM holidays WHERE holiday_date BETWEEN $1 AND $2",
            [startDate, endDate]
        );
        const holidays = holidaysResult.rows;
        const holidayMap = {};
        holidays.forEach(h => {
            const dateStr = toDateString(h.holiday_date);
            holidayMap[dateStr] = h.name;
        });

        // 3. Fetch all validated absences for this month range
        const absencesResult = await db.query(
            `SELECT employee_id, type, start_date, end_date 
             FROM absences 
             WHERE status = 'Validated' 
             AND start_date <= $2 
             AND end_date >= $1`,
            [startDate, endDate]
        );
        const absences = absencesResult.rows;

        // 4. Fetch all attendance logs for this month range
        const attendanceResult = await db.query(
            "SELECT employee_id, date, status, validation_status, justification_reason FROM attendance WHERE date BETWEEN $1 AND $2",
            [startDate, endDate]
        );
        const attendanceList = attendanceResult.rows;

        // Build a mapping for fast lookups
        const attendanceMap = {};
        attendanceList.forEach(a => {
            const dateStr = toDateString(a.date);
            if (!attendanceMap[a.employee_id]) {
                attendanceMap[a.employee_id] = {};
            }
            attendanceMap[a.employee_id][dateStr] = {
                status: a.status,
                validationStatus: a.validation_status,
                justificationReason: a.justification_reason
            };
        });

        const todayStr = toDateString(new Date());

        const matrix = employees.map(emp => {
            const dailyStatus = [];
            let totalWorkedDays = 0;

            for (let day = 1; day <= totalDays; day++) {
                const date = new Date(parsedYear, parsedMonth - 1, day);
                const dateStr = toDateString(date);
                const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

                let cell = {
                    day,
                    date: dateStr,
                    status: 'present',
                    label: '✓',
                    hoverText: 'Present'
                };

                // Check Weekend
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    cell.status = 'weekend';
                    cell.label = '';
                    cell.hoverText = 'Weekend';
                }
                // Check Holiday
                else if (holidayMap[dateStr]) {
                    cell.status = 'holiday';
                    cell.label = '';
                    cell.hoverText = `Holiday: ${holidayMap[dateStr]}`;
                }
                // Check Validated Absence
                else {
                    const matchedAbsence = absences.find(abs => 
                        abs.employee_id === emp.id && 
                        new Date(abs.start_date) <= date && 
                        new Date(abs.end_date) >= date
                    );

                    if (matchedAbsence) {
                        cell.status = 'absent';
                        cell.label = matchedAbsence.type === 'Sick Leave' ? 'S' : matchedAbsence.type === 'Vacation' ? 'V' : matchedAbsence.type === 'Training' ? 'T' : 'O';
                        cell.hoverText = matchedAbsence.type;
                    }
                    // Check Future Date
                    else if (dateStr > todayStr) {
                        cell.status = 'future';
                        cell.label = '';
                        cell.hoverText = 'Future Date';
                    }
                    // Check Attendance Logs
                    else {
                        const att = attendanceMap[emp.id]?.[dateStr];
                        if (att) {
                            if (att.status === 'Present' || att.status === 'Late') {
                                cell.status = 'present';
                                cell.label = '✓';
                                cell.hoverText = att.status;
                                totalWorkedDays++;
                            } else {
                                if (att.validationStatus === 'Justified') {
                                    cell.status = 'absent';
                                    cell.label = 'J';
                                    cell.hoverText = `Justified: ${att.justificationReason || 'Excused'}`;
                                } else {
                                    cell.status = 'absent';
                                    cell.label = 'A';
                                    cell.hoverText = 'Unexcused Absence';
                                }
                            }
                        } else {
                            // Default to unexcused absence for past weekdays with no check-in
                            cell.status = 'absent';
                            cell.label = 'A';
                            cell.hoverText = 'Unexcused Absence';
                        }
                    }
                }

                dailyStatus.push(cell);
            }

            return {
                employee_id: emp.id,
                matricule: emp.matricule,
                name: `${emp.first_name} ${emp.last_name}`,
                department: emp.department || '—',
                dailyStatus,
                totalWorkedDays
            };
        });

        res.json({
            success: true,
            data: {
                year: parsedYear,
                month: parsedMonth,
                totalDays,
                matrix
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to load attendance matrix report"
        });
    }
};

module.exports = {
    getReportStats,
    getMonthlyAbsenceEvolution,
    getDepartmentStats,
    getAbsenceTypes,
    getEmployeeRanking,
    getDetailedAbsences,
    exportToExcel,
    getMonthlyReport,
    getAttendanceMatrix
};
