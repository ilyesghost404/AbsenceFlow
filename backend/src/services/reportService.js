const ExcelJS = require("exceljs");
const db = require("../config/database");
const { getHolidays, countWorkingDays, calculateAttendance, toDateString } = require("./attendanceService");

async function generateMonthlyReport(year, month) {
    const employeesResult = await db.query("SELECT * FROM employees ORDER BY matricule");
    const employees = employeesResult.rows;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const monthName = startDate.toLocaleString('default', { month: 'long' });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");
    
    worksheet.addRow(["AbsenceFlow"]);
    worksheet.addRow(["Monthly Attendance Report"]);
    worksheet.addRow([`${monthName} ${year}`]);
    worksheet.addRow([]);
    
    worksheet.columns = [
        { header: "Matricule", key: "matricule", width: 15 },
        { header: "First Name", key: "firstName", width: 20 },
        { header: "Last Name", key: "lastName", width: 20 },
        { header: "Department", key: "department", width: 20 },
        { header: "Month", key: "month", width: 10 },
        { header: "Year", key: "year", width: 10 },
        { header: "Working Days", key: "workingDays", width: 15 },
        { header: "Absence Days", key: "absenceDays", width: 15 },
        { header: "Worked Days", key: "workedDays", width: 15 },
        { header: "Attendance Rate", key: "attendanceRate", width: 20 }
    ];
    
    const titleRow1 = worksheet.getRow(1);
    titleRow1.getCell(1).font = { bold: true, size: 18, color: { argb: '2563eb' } };
    const titleRow2 = worksheet.getRow(2);
    titleRow2.getCell(1).font = { bold: true, size: 14 };
    const titleRow3 = worksheet.getRow(3);
    titleRow3.getCell(1).font = { size: 12 };
    
    worksheet.mergeCells('A1:J1');
    worksheet.mergeCells('A2:J2');
    worksheet.mergeCells('A3:J3');
    
    const headerRow = worksheet.getRow(5);
    headerRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2563eb' }
        };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    
    let totalWorkingDays = 0;
    let totalAbsenceDays = 0;
    let totalWorkedDays = 0;
    
    for (const employee of employees) {
        const attendance = await calculateAttendance(
            employee.id,
            toDateString(startDate),
            toDateString(endDate)
        );
        
        totalWorkingDays += attendance.workingDays;
        totalAbsenceDays += attendance.absenceDays;
        totalWorkedDays += attendance.workedDays;
        
        const row = worksheet.addRow({
            matricule: employee.matricule,
            firstName: employee.first_name,
            lastName: employee.last_name,
            department: employee.department || '',
            month: month,
            year: year,
            workingDays: attendance.workingDays,
            absenceDays: attendance.absenceDays,
            workedDays: attendance.workedDays,
            attendanceRate: attendance.attendanceRate / 100
        });
        
        row.getCell("attendanceRate").numFmt = '0.00%';
        
        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'left' };
        });
    }
    
    const summaryRowIndex = worksheet.rowCount + 1;
    worksheet.addRow([
        "Total", "", "", "", "", "",
        totalWorkingDays,
        totalAbsenceDays,
        totalWorkedDays,
        totalWorkingDays > 0 ? totalWorkedDays / totalWorkingDays : 0
    ]);
    
    const summaryRow = worksheet.getRow(summaryRowIndex);
    summaryRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'e2e8f0' }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    
    summaryRow.getCell("attendanceRate").numFmt = '0.00%';
    
    worksheet.autoFilter = {
        from: 'A5',
        to: 'J5'
    };
    
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 10;
            if (cellLength > maxLength) {
                maxLength = cellLength;
            }
        });
        column.width = Math.min(maxLength + 2, 50);
    });
    
    return workbook;
}

async function generateCustomReport(filters = {}) {
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (filters.startDate) {
        conditions.push(`a.start_date >= $${paramIndex++}`);
        params.push(filters.startDate);
    }
    if (filters.endDate) {
        conditions.push(`a.end_date <= $${paramIndex++}`);
        params.push(filters.endDate);
    }
    if (filters.department) {
        conditions.push(`e.department = $${paramIndex++}`);
        params.push(filters.department);
    }
    if (filters.status) {
        conditions.push(`a.status = $${paramIndex++}`);
        params.push(filters.status);
    }
    if (filters.type) {
        conditions.push(`a.type = $${paramIndex++}`);
        params.push(filters.type);
    }

    const whereClause = conditions.length > 0 
        ? 'WHERE ' + conditions.join(' AND ') 
        : '';

    const query = `
        SELECT 
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
    `;

    const result = await db.query(query, params);
    const absences = result.rows;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Absences Report");

    worksheet.addRow(["AbsenceFlow"]);
    worksheet.addRow(["Absences Report"]);
    worksheet.addRow([`Generated: ${new Date().toLocaleDateString()}`]);
    worksheet.addRow([]);

    worksheet.columns = [
        { header: "Employee Name", key: "employeeName", width: 25 },
        { header: "Matricule", key: "matricule", width: 15 },
        { header: "Department", key: "department", width: 20 },
        { header: "Absence Type", key: "type", width: 15 },
        { header: "Start Date", key: "startDate", width: 15 },
        { header: "End Date", key: "endDate", width: 15 },
        { header: "Duration (Days)", key: "duration", width: 15 },
        { header: "Status", key: "status", width: 12 },
        { header: "Reason", key: "reason", width: 30 }
    ];

    const titleRow1 = worksheet.getRow(1);
    titleRow1.getCell(1).font = { bold: true, size: 18, color: { argb: '2563eb' } };
    const titleRow2 = worksheet.getRow(2);
    titleRow2.getCell(1).font = { bold: true, size: 14 };
    const titleRow3 = worksheet.getRow(3);
    titleRow3.getCell(1).font = { size: 12 };

    worksheet.mergeCells('A1:I1');
    worksheet.mergeCells('A2:I2');
    worksheet.mergeCells('A3:I3');

    const headerRow = worksheet.getRow(5);
    headerRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2563eb' }
        };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    for (const absence of absences) {
        const startStr = toDateString(absence.start_date);
        const endStr = toDateString(absence.end_date);
        const absHolidays = await getHolidays(startStr, endStr);
        const workingDays = countWorkingDays(startStr, endStr, absHolidays);

        const row = worksheet.addRow({
            employeeName: absence.employee_name,
            matricule: absence.matricule,
            department: absence.department || '',
            type: absence.type,
            startDate: absence.start_date ? new Date(absence.start_date).toLocaleDateString() : '',
            endDate: absence.end_date ? new Date(absence.end_date).toLocaleDateString() : '',
            duration: workingDays,
            status: absence.status,
            reason: absence.reason || ''
        });

        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'left' };
        });
    }

    worksheet.autoFilter = {
        from: 'A5',
        to: 'I5'
    };

    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 10;
            if (cellLength > maxLength) {
                maxLength = cellLength;
            }
        });
        column.width = Math.min(maxLength + 2, 50);
    });

    return workbook;
}

module.exports = {
    generateMonthlyReport,
    generateCustomReport
};
