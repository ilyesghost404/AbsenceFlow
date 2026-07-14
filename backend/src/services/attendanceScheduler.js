const cron = require('node-cron');
const db = require('../config/database');

const runAttendanceScheduler = () => {
  // Run every working day at 17:30
  // cron syntax: second minute hour day month weekday
  // Weekday 1-5: Monday to Friday
  cron.schedule('30 17 * * 1-5', async () => {
    console.log('Running automatic attendance check...');
    
    try {
      // Step 1: Get all employees
      const employeesResult = await db.query('SELECT id FROM employees');
      const employees = employeesResult.rows;
      
      if (employees.length === 0) {
        console.log('No employees found');
        return;
      }

      // Step 2: Get today's attendance records
      const todayAttendanceResult = await db.query(
        'SELECT employee_id FROM attendance WHERE date = CURRENT_DATE'
      );
      const attendedEmployeeIds = new Set(
        todayAttendanceResult.rows.map(row => row.employee_id)
      );

      // Step 3: For employees without attendance today, mark as Absent and create absence
      for (const employee of employees) {
        if (!attendedEmployeeIds.has(employee.id)) {
          try {
            await db.query(
              `INSERT INTO attendance (employee_id, date, status) 
               VALUES ($1, CURRENT_DATE, 'Absent')
               ON CONFLICT (employee_id, date) DO NOTHING`,
              [employee.id]
            );

            // Create automatic absence record
            await db.query(
              `INSERT INTO absences (employee_id, type, start_date, end_date, reason, status, source)
               VALUES ($1, 'Other', CURRENT_DATE, CURRENT_DATE, 'Automatic absence - no check-in detected', 'Validated', 'automatic')
               ON CONFLICT DO NOTHING`,
              [employee.id]
            );

            console.log(`Marked employee ${employee.id} as Absent and created automatic absence for today`);
          } catch (error) {
            console.error(`Error processing employee ${employee.id}:`, error.message);
          }
        }
      }

      console.log('Automatic attendance check completed');
    } catch (error) {
      console.error('Error running attendance scheduler:', error);
    }
  });

  console.log('Attendance scheduler started (runs Mon-Fri at 17:30)');
};

module.exports = { runAttendanceScheduler };
