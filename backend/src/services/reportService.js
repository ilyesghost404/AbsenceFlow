const ExcelJS = require("exceljs");
const db = require("../config/database");
const { getHolidays, countWorkingDays, calculateAttendance, toDateString } = require("./attendanceService");

async function generateMonthlyReport(year, month) {
    const employeesResult = await db.query("SELECT e.*, d.name as department FROM employees e LEFT JOIN departments d ON e.department_id = d.id ORDER BY e.matricule");
    const employees = employeesResult.rows;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const monthName = startDate.toLocaleString('default', { month: 'long' });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");
    
    worksheet.addRow(["WinSAP"]);
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

async function generateDetailedAttendanceReport(filters) {
    const { department_id, start_date, end_date, month } = filters;
    let startDateStr, endDateStr, monthName, year, parsedMonth;

    if (month) {
        const [yStr, mStr] = month.split('-');
        year = parseInt(yStr, 10);
        parsedMonth = parseInt(mStr, 10);
        
        const lastDayNum = new Date(year, parsedMonth, 0).getDate();
        const mFormatted = String(parsedMonth).padStart(2, '0');
        const lastDayFormatted = String(lastDayNum).padStart(2, '0');
        
        startDateStr = `${year}-${mFormatted}-01`;
        endDateStr = `${year}-${mFormatted}-${lastDayFormatted}`;
        
        monthName = new Date(year, parsedMonth - 1, 1).toLocaleString('en-US', { month: 'long' });
    } else if (start_date && end_date) {
        startDateStr = toDateString(start_date);
        endDateStr = toDateString(end_date);
        
        const [sY, sM, sD] = startDateStr.split('-').map(Number);
        const sDate = new Date(sY, sM - 1, sD);
        year = sDate.getFullYear();
        monthName = "Custom Range";
    } else {
        const now = new Date();
        year = now.getFullYear();
        parsedMonth = now.getMonth() + 1;
        
        const lastDayNum = new Date(year, parsedMonth, 0).getDate();
        const mFormatted = String(parsedMonth).padStart(2, '0');
        const lastDayFormatted = String(lastDayNum).padStart(2, '0');
        
        startDateStr = `${year}-${mFormatted}-01`;
        endDateStr = `${year}-${mFormatted}-${lastDayFormatted}`;
        
        monthName = new Date(year, parsedMonth - 1, 1).toLocaleString('en-US', { month: 'long' });
    }

    const [sY, sM, sD] = startDateStr.split('-').map(Number);
    const [eY, eM, eD] = endDateStr.split('-').map(Number);

    const startDate = new Date(sY, sM - 1, sD);
    const endDate = new Date(eY, eM - 1, eD);

    const dates = [];
    let cur = new Date(sY, sM - 1, sD);
    while (cur <= endDate) {
        dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    const totalDays = dates.length;

    let empQuery = "SELECT e.id, e.matricule, e.first_name, e.last_name, e.position, d.name as department FROM employees e LEFT JOIN departments d ON e.department_id = d.id";
    const empParams = [];
    if (department_id) {
        empQuery += " WHERE e.department_id = $1";
        empParams.push(department_id);
    }
    empQuery += " ORDER BY e.matricule";
    const employeesResult = await db.query(empQuery, empParams);
    const employees = employeesResult.rows;

    const holidaysResult = await db.query(
        "SELECT holiday_date, name FROM holidays WHERE holiday_date BETWEEN $1 AND $2",
        [startDateStr, endDateStr]
    );
    const holidayMap = {};
    holidaysResult.rows.forEach(h => {
        holidayMap[toDateString(h.holiday_date)] = h.name;
    });

    const absencesResult = await db.query(
        `SELECT employee_id, type, start_date, end_date 
         FROM absences 
         WHERE status = 'Validated' 
         AND start_date <= $2 
         AND end_date >= $1`,
        [startDateStr, endDateStr]
    );
    const absences = absencesResult.rows;

    const attendanceResult = await db.query(
        "SELECT employee_id, date, status FROM attendance WHERE date BETWEEN $1 AND $2",
        [startDateStr, endDateStr]
    );
    const attendanceMap = {};
    attendanceResult.rows.forEach(a => {
        const dateStr = toDateString(a.date);
        if (!attendanceMap[a.employee_id]) attendanceMap[a.employee_id] = {};
        attendanceMap[a.employee_id][dateStr] = a.status;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    worksheet.addRow(["WinSAP"]);
    worksheet.addRow(["Attendance Report"]);
    if (month) {
        worksheet.addRow([`Selected Month: ${monthName}`, `Selected Year: ${year}`]);
    } else {
        worksheet.addRow([`Date Range: ${startDateStr} to ${endDateStr}`]);
    }
    const deptName = employees.length > 0 && department_id ? employees[0].department : "All Departments";
    worksheet.addRow([`Department: ${deptName}`, `Generated: ${new Date().toLocaleDateString()}`]);
    
    const columns = [
        { header: "Matricule", key: "matricule", width: 15 },
        { header: "First Name", key: "firstName", width: 20 },
        { header: "Last Name", key: "lastName", width: 20 },
        { header: "Department", key: "department", width: 20 },
        { header: "Position", key: "position", width: 20 }
    ];

    for (let day = 0; day < totalDays; day++) {
        const d = dates[day];
        const dayStr = String(d.getDate()).padStart(2, '0');
        const monthShort = d.toLocaleString('en-US', { month: 'short' });
        columns.push({ header: `${dayStr} ${monthShort}`, key: `d_${day}`, width: 10 });
    }

    columns.push(
        { header: "Working Days", key: "workingDays", width: 15 },
        { header: "Absence Days", key: "absenceDays", width: 15 },
        { header: "Worked Days", key: "workedDays", width: 15 },
        { header: "Attendance Rate", key: "attendanceRate", width: 18 }
    );

    worksheet.columns = columns.map(c => ({ key: c.key, width: c.width }));
    worksheet.addRow(columns.map(c => c.header));

    worksheet.views = [{ state: "frozen", xSplit: 5, ySplit: 5 }];

    worksheet.getRow(1).getCell(1).font = { bold: true, size: 18, color: { argb: '2563eb' } };
    worksheet.getRow(2).getCell(1).font = { bold: true, size: 14 };
    
    const headerRow = worksheet.getRow(5);
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'ffffff' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563eb' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    const todayStr = toDateString(new Date());

    for (const emp of employees) {
        const rowData = {
            matricule: emp.matricule,
            firstName: emp.first_name,
            lastName: emp.last_name,
            department: emp.department || '—',
            position: emp.position || '—'
        };

        let workingDays = 0;
        let absenceDays = 0;
        let workedDays = 0;

        for (let i = 0; i < totalDays; i++) {
            const d = dates[i];
            const dateStr = toDateString(d);
            const dayOfWeek = d.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = !!holidayMap[dateStr];

            let cellValue = '';
            
            if (isWeekend) {
                cellValue = 'W';
            } else if (isHoliday) {
                cellValue = 'H';
            } else {
                workingDays++;
                
                const matchedAbsence = absences.find(abs => {
                    if (abs.employee_id !== emp.id) return false;
                    const aStartStr = toDateString(abs.start_date);
                    const aEndStr = toDateString(abs.end_date);
                    return aStartStr <= dateStr && aEndStr >= dateStr;
                });

                if (matchedAbsence) {
                    cellValue = 'A';
                    absenceDays++;
                } else if (dateStr > todayStr) {
                    cellValue = '';
                } else {
                    const status = attendanceMap[emp.id]?.[dateStr];
                    if (status === 'Present' || status === 'Late') {
                        cellValue = 'P';
                        workedDays++;
                    } else {
                        cellValue = 'A';
                        absenceDays++;
                    }
                }
            }
            rowData[`d_${i}`] = cellValue;
        }

        rowData.workingDays = workingDays;
        rowData.absenceDays = absenceDays;
        rowData.workedDays = workedDays;
        rowData.attendanceRate = workingDays > 0 ? (workedDays / workingDays) : 0;

        const row = worksheet.addRow(rowData);
        
        row.getCell('attendanceRate').numFmt = '0.00%';

        row.eachCell((cell, colNum) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            
            if (colNum > 5 && colNum <= 5 + totalDays) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                const val = cell.value;
                if (val === 'W' || val === 'H') {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'e2e8f0' } };
                    cell.font = { color: { argb: '64748b' } };
                } else if (val === 'A') {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fee2e2' } };
                    cell.font = { color: { argb: 'ef4444' }, bold: true };
                }
            } else {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
        });
    }

    return workbook;
}

module.exports = {
    generateMonthlyReport,
    generateDetailedAttendanceReport
};
