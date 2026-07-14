const db = require("../config/database");
const { getHolidays, countWorkingDays } = require("../services/attendanceService");

// ─────────────────────────────────────────────────────────────────────────────
// Existing dashboard stats (used by employee/manager dashboards — DO NOT REMOVE)
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Retrieve next upcoming holiday (used by all dashboards)
    const nextHolidayResult = await db.query(`
      SELECT * FROM holidays 
      WHERE holiday_date >= CURRENT_DATE
      ORDER BY holiday_date ASC
      LIMIT 1
    `);
    const nextHoliday = nextHolidayResult.rows[0];

    // If the logged-in user is an employee, return a personalized view
    if (req.user.role === "employee") {
      const employeeId = req.user.employee_id;
      if (!employeeId) {
        return res.json({
          success: true,
          data: {
            isEmployee: true,
            employeeInfo: null,
            nextHoliday,
            pendingRequests: 0,
            approvedRequests: 0,
            totalAbsences: 0,
            recentAbsences: []
          }
        });
      }

      const employeeResult = await db.query("SELECT * FROM employees WHERE id = $1", [employeeId]);
      const employeeInfo = employeeResult.rows[0];

      const pendingResult = await db.query("SELECT COUNT(*) FROM absences WHERE employee_id = $1 AND status = 'Pending'", [employeeId]);
      const pendingRequests = parseInt(pendingResult.rows[0].count);

      const approvedResult = await db.query("SELECT COUNT(*) FROM absences WHERE employee_id = $1 AND status = 'Validated'", [employeeId]);
      const approvedRequests = parseInt(approvedResult.rows[0].count);

      const totalResult = await db.query("SELECT COUNT(*) FROM absences WHERE employee_id = $1", [employeeId]);
      const totalAbsences = parseInt(totalResult.rows[0].count);

      const recentAbsencesResult = await db.query(`
        SELECT * FROM absences 
        WHERE employee_id = $1 
        ORDER BY created_at DESC 
        LIMIT 5
      `, [employeeId]);

      const usedVacationResult = await db.query(`
        SELECT start_date, end_date
        FROM absences 
        WHERE employee_id = $1 
        AND status = 'Validated' 
        AND type = 'Vacation'
        AND EXTRACT(YEAR FROM start_date) = $2
      `, [employeeId, currentYear]);
      
      let usedVacationDays = 0;
      for (const row of usedVacationResult.rows) {
        const startStr = typeof row.start_date === 'string' ? row.start_date : row.start_date.toISOString().split('T')[0];
        const endStr = typeof row.end_date === 'string' ? row.end_date : row.end_date.toISOString().split('T')[0];
        const absHolidays = await getHolidays(startStr, endStr);
        usedVacationDays += countWorkingDays(startStr, endStr, absHolidays);
      }
      const remainingVacationDays = Math.max(0, 30 - usedVacationDays);

      return res.json({
        success: true,
        data: {
          isEmployee: true,
          employeeInfo,
          nextHoliday,
          pendingRequests,
          approvedRequests,
          totalAbsences,
          remainingVacationDays,
          recentAbsences: recentAbsencesResult.rows
        }
      });
    }

    // Admin/Manager stats (legacy — kept for backward compatibility)
    const totalEmployeesResult = await db.query("SELECT COUNT(*) FROM employees");
    const totalEmployees = parseInt(totalEmployeesResult.rows[0].count);

    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    const isTodayWeekend = todayDate.getDay() === 0 || todayDate.getDay() === 6;
    const todayHolidays = await getHolidays(today, today);
    const isTodayHoliday = todayHolidays.length > 0;

    const presentResult = await db.query(`
      SELECT COUNT(DISTINCT employee_id) 
      FROM attendance 
      WHERE date = $1 AND status = 'Present'
    `, [today]);
    const presentToday = parseInt(presentResult.rows[0].count);

    const lateResult = await db.query(`
      SELECT COUNT(DISTINCT employee_id) 
      FROM attendance 
      WHERE date = $1 AND status = 'Late'
    `, [today]);
    const lateToday = parseInt(lateResult.rows[0].count);

    const absentToday = (isTodayWeekend || isTodayHoliday)
      ? 0
      : Math.max(0, totalEmployees - presentToday - lateToday);

    const missingCheckoutResult = await db.query(`
      SELECT COUNT(DISTINCT employee_id) 
      FROM attendance 
      WHERE date < $1 AND check_in IS NOT NULL AND check_out IS NULL
    `, [today]);
    const missingCheckout = parseInt(missingCheckoutResult.rows[0].count);

    const pendingResult = await db.query("SELECT COUNT(*) FROM absences WHERE status = 'Pending'");
    const pendingRequests = parseInt(pendingResult.rows[0].count);

    const approvedResult = await db.query("SELECT COUNT(*) FROM absences WHERE status = 'Validated'");
    const approvedRequests = parseInt(approvedResult.rows[0].count);

    const rejectedResult = await db.query("SELECT COUNT(*) FROM absences WHERE status = 'Rejected'");
    const rejectedRequests = parseInt(rejectedResult.rows[0].count);

    const onLeaveTodayResult = await db.query(`
      SELECT COUNT(DISTINCT employee_id) FROM absences 
      WHERE status = 'Validated' AND start_date <= $1 AND end_date >= $1
    `, [today]);
    const employeesOnLeaveToday = parseInt(onLeaveTodayResult.rows[0].count);

    const holidaysResult = await db.query(`
      SELECT COUNT(*) FROM holidays 
      WHERE EXTRACT(YEAR FROM holiday_date) = $1 
      AND EXTRACT(MONTH FROM holiday_date) = $2
    `, [currentYear, currentMonth]);
    const holidaysThisMonth = parseInt(holidaysResult.rows[0].count);

    const absencesThisMonthResult = await db.query(`
      SELECT COUNT(*) FROM absences 
      WHERE EXTRACT(YEAR FROM start_date) = $1 
      AND EXTRACT(MONTH FROM start_date) = $2
    `, [currentYear, currentMonth]);
    const absencesThisMonth = parseInt(absencesThisMonthResult.rows[0].count);

    const workingDaysThisMonth = await getWorkingDaysInMonth(currentYear, currentMonth);
    const possibleWorkingDays = totalEmployees * workingDaysThisMonth;
    const absenceRate = possibleWorkingDays > 0
      ? parseFloat(((absencesThisMonth / possibleWorkingDays) * 100).toFixed(1))
      : 0;

    const monthlyTrendResult = await db.query(`
      SELECT 
        EXTRACT(YEAR FROM start_date) as year,
        EXTRACT(MONTH FROM start_date) as month,
        COUNT(*) as count
      FROM absences
      WHERE start_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(YEAR FROM start_date), EXTRACT(MONTH FROM start_date)
      ORDER BY year, month
    `);

    const deptAbsencesResult = await db.query(`
      SELECT 
        e.department,
        COUNT(a.id) as count
      FROM absences a
      JOIN employees e ON a.employee_id = e.id
      GROUP BY e.department
      ORDER BY count DESC
    `);

    const typesResult = await db.query(`
      SELECT type, COUNT(*) as count
      FROM absences
      GROUP BY type
      ORDER BY count DESC
    `);

    const weeklyAttendanceResult = await db.query(`
      SELECT 
        EXTRACT(DOW FROM date) as day_of_week,
        COUNT(DISTINCT employee_id) as present
      FROM attendance
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY EXTRACT(DOW FROM date)
      ORDER BY day_of_week
    `);

    const deptWithMostAbsences = deptAbsencesResult.rows[0];

    const topEmployeeResult = await db.query(`
      SELECT 
        e.first_name || ' ' || e.last_name as name,
        COUNT(a.id) as count
      FROM absences a
      JOIN employees e ON a.employee_id = e.id
      WHERE EXTRACT(YEAR FROM start_date) = $1
        AND EXTRACT(MONTH FROM start_date) = $2
      GROUP BY e.id, e.first_name, e.last_name
      ORDER BY count DESC
      LIMIT 1
    `, [currentYear, currentMonth]);
    const topEmployee = topEmployeeResult.rows[0];

    const absenceDatesResult = await db.query(`
      SELECT start_date, end_date
      FROM absences
      WHERE end_date IS NOT NULL AND start_date IS NOT NULL
    `);
    let totalWorkingAbsenceDays = 0;
    for (const row of absenceDatesResult.rows) {
      const startStr = row.start_date.toISOString ? row.start_date.toISOString().split('T')[0] : row.start_date;
      const endStr = row.end_date.toISOString ? row.end_date.toISOString().split('T')[0] : row.end_date;
      const absHolidays = await getHolidays(startStr, endStr);
      totalWorkingAbsenceDays += countWorkingDays(startStr, endStr, absHolidays);
    }
    const avgAbsenceDuration = absenceDatesResult.rows.length > 0
      ? (totalWorkingAbsenceDays / absenceDatesResult.rows.length).toFixed(1)
      : 0;

    const recentActivity = [];

    const recentAbsences = await db.query(`
      SELECT 
        'New absence request' as action,
        e.first_name || ' ' || e.last_name as user_name,
        a.created_at as date_time,
        a.status as status
      FROM absences a
      JOIN employees e ON a.employee_id = e.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);
    recentActivity.push(...recentAbsences.rows);

    const recentHolidays = await db.query(`
      SELECT 
        'Holiday added' as action,
        name as user_name,
        holiday_date as date_time,
        'Added' as status
      FROM holidays
      ORDER BY holiday_date DESC
      LIMIT 2
    `);
    recentActivity.push(...recentHolidays.rows);

    const recentEmployees = await db.query(`
      SELECT 
        'Employee added' as action,
        first_name || ' ' || last_name as user_name,
        created_at as date_time,
        'Active' as status
      FROM employees
      ORDER BY created_at DESC
      LIMIT 2
    `);
    recentActivity.push(...recentEmployees.rows);

    recentActivity.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        missingCheckout,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        employeesOnLeaveToday,
        holidaysThisMonth,
        absenceRate,
        monthlyTrend: monthlyTrendResult.rows,
        absencesByDepartment: deptAbsencesResult.rows,
        absenceTypes: typesResult.rows,
        weeklyAttendance: weeklyAttendanceResult.rows,
        nextHoliday,
        deptWithMostAbsences,
        topEmployee,
        avgAbsenceDuration,
        absencesThisMonth,
        recentActivity: recentActivity.slice(0, 8),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics"
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Admin-specific dashboard stats (user management & account activity)
// ─────────────────────────────────────────────────────────────────────────────
const getAdminDashboardStats = async (req, res) => {
  try {
    // ── Account counts ──────────────────────────────────────────────────────
    const countsResult = await db.query(`
      SELECT
        COUNT(*)                                             AS total_users,
        COUNT(*) FILTER (WHERE is_active = true)             AS active_accounts,
        COUNT(*) FILTER (WHERE is_active = false)            AS disabled_accounts,
        COUNT(*) FILTER (WHERE role = 'admin')               AS admins,
        COUNT(*) FILTER (WHERE role = 'manager')             AS managers,
        COUNT(*) FILTER (WHERE role = 'employee')            AS employees,
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
        )                                                    AS new_this_month,
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('week', created_at) >= DATE_TRUNC('week', NOW())
        )                                                    AS new_this_week
      FROM users
    `);
    const counts = countsResult.rows[0];

    // ── Logged in today ─────────────────────────────────────────────────────
    const loggedInTodayResult = await db.query(`
      SELECT COUNT(DISTINCT user_id) AS logged_in_today
      FROM login_history
      WHERE success = true
        AND DATE_TRUNC('day', login_time) = DATE_TRUNC('day', NOW())
    `);
    const loggedInToday = parseInt(loggedInTodayResult.rows[0].logged_in_today);

    // ── Failed login attempts (last 24 hours) ───────────────────────────────
    const failedLoginsResult = await db.query(`
      SELECT COUNT(*) AS failed_logins
      FROM login_history
      WHERE success = false
        AND login_time >= NOW() - INTERVAL '24 hours'
    `);
    const failedLogins24h = parseInt(failedLoginsResult.rows[0].failed_logins);

    // ── Never logged in ─────────────────────────────────────────────────────
    const neverLoggedInResult = await db.query(`
      SELECT COUNT(*) AS never_logged_in
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM login_history lh WHERE lh.user_id = u.id AND lh.success = true
      )
    `);
    const neverLoggedIn = parseInt(neverLoggedInResult.rows[0].never_logged_in);

    // ── User growth: new users per month (last 12 months) ──────────────────
    const userGrowthResult = await db.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month_label,
        DATE_TRUNC('month', created_at)                       AS month_date,
        COUNT(*)                                              AS count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date ASC
    `);

    // ── Role distribution ───────────────────────────────────────────────────
    const roleDistResult = await db.query(`
      SELECT role, COUNT(*) AS count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `);

    // ── Department distribution ─────────────────────────────────────────────
    const deptDistResult = await db.query(`
      SELECT
        COALESCE(e.department, 'No Department') AS department,
        COUNT(u.id) AS count
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      GROUP BY COALESCE(e.department, 'No Department')
      ORDER BY count DESC
    `);

    // ── Recent account activity ─────────────────────────────────────────────
    const recentActivityResult = await db.query(`
      SELECT
        al.id,
        al.action_type,
        al.description,
        al.created_at,
        al.ip_address,
        actor.username  AS actor_username,
        target.username AS target_username
      FROM activity_logs al
      LEFT JOIN users actor  ON al.actor_id       = actor.id
      LEFT JOIN users target ON al.target_user_id = target.id
      ORDER BY al.created_at DESC
      LIMIT 20
    `);

    // ── Recent users ────────────────────────────────────────────────────────
    const recentUsersResult = await db.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS full_name,
        e.department
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    // ── Account status overview ─────────────────────────────────────────────
    const statusOverviewResult = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_active = true)  AS active,
        COUNT(*) FILTER (WHERE is_active = false) AS disabled,
        COUNT(*) FILTER (
          WHERE created_at >= NOW() - INTERVAL '7 days'
        )                                          AS created_this_week,
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
        )                                          AS created_this_month
      FROM users
    `);
    const statusOverview = statusOverviewResult.rows[0];

    res.json({
      success: true,
      data: {
        // Account stat cards
        totalUsers:       parseInt(counts.total_users),
        activeAccounts:   parseInt(counts.active_accounts),
        disabledAccounts: parseInt(counts.disabled_accounts),
        admins:           parseInt(counts.admins),
        managers:         parseInt(counts.managers),
        employees:        parseInt(counts.employees),
        newThisMonth:     parseInt(counts.new_this_month),
        newThisWeek:      parseInt(counts.new_this_week),
        loggedInToday,
        failedLogins24h,
        neverLoggedIn,

        // Charts
        userGrowth:          userGrowthResult.rows,
        roleDistribution:    roleDistResult.rows,
        deptDistribution:    deptDistResult.rows,

        // Tables / timelines
        recentActivity:  recentActivityResult.rows,
        recentUsers:     recentUsersResult.rows,

        // Account status overview cards
        statusOverview: {
          active:           parseInt(statusOverview.active),
          disabled:         parseInt(statusOverview.disabled),
          createdThisWeek:  parseInt(statusOverview.created_this_week),
          createdThisMonth: parseInt(statusOverview.created_this_month),
          neverLoggedIn,
        }
      }
    });

  } catch (error) {
    console.error("getAdminDashboardStats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin dashboard statistics" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Global user search
// ─────────────────────────────────────────────────────────────────────────────
const getAdminDashboardSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;

    const result = await db.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS full_name,
        e.department
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE
        LOWER(u.username) LIKE $1
        OR LOWER(u.email)   LIKE $1
        OR LOWER(CONCAT(e.first_name, ' ', e.last_name)) LIKE $1
        OR LOWER(e.department) LIKE $1
      ORDER BY u.created_at DESC
      LIMIT 20
    `, [searchTerm]);

    res.json({ success: true, data: result.rows });

  } catch (error) {
    console.error("getAdminDashboardSearch error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: System health check
// ─────────────────────────────────────────────────────────────────────────────
const getSystemHealth = async (req, res) => {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatency = null;

  try {
    const dbStart = Date.now();
    await db.query("SELECT 1");
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
  }

  const apiLatency = Date.now() - startTime;

  res.json({
    success: true,
    data: {
      database:  { status: dbStatus,   latency: dbLatency },
      api:       { status: "healthy",  latency: apiLatency },
      server:    { status: "healthy",  uptime: Math.floor(process.uptime()) },
      timestamp: new Date().toISOString()
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
const getWorkingDaysInMonth = async (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  let workingDays = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) workingDays++;
  }

  const holidaysResult = await db.query(`
    SELECT COUNT(*) FROM holidays
    WHERE EXTRACT(YEAR FROM holiday_date) = $1 
    AND EXTRACT(MONTH FROM holiday_date) = $2
    AND EXTRACT(DOW FROM holiday_date) NOT IN (0, 6)
  `, [year, month]);

  return Math.max(1, workingDays - parseInt(holidaysResult.rows[0].count));
};

module.exports = {
  getDashboardStats,
  getAdminDashboardStats,
  getAdminDashboardSearch,
  getSystemHealth
};
