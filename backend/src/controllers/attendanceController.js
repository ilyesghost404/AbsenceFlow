const Attendance = require("../models/Attendance");
const { getHolidays, toDateString } = require("../services/attendanceService");

const getAttendance = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await Attendance.getAll({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search: search || ''
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attendance records" });
  }
};

const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.getById(id);

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attendance record" });
  }
};

const createAttendance = async (req, res) => {
  try {
    const { employee_id, date, status, check_in, check_out } = req.body;

    if (!employee_id || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, date, and status are required"
      });
    }

    // Reject attendance on holidays
    const holidays = await getHolidays(date, date);
    if (holidays.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot record attendance on a holiday. ${date} is a public holiday.`
      });
    }
    // Reject on weekends
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({
        success: false,
        message: `Cannot record attendance on a weekend.`
      });
    }

    const attendance = await Attendance.create(req.body);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error creating attendance:", error);
    if (error.code === "23503") {
      return res.status(400).json({ success: false, message: "Employee not found" });
    }
    res.status(500).json({ success: false, message: "Failed to create attendance record" });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, date, status, check_in, check_out } = req.body;

    if (!employee_id || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, date, and status are required"
      });
    }

    // Reject attendance on holidays
    const holidays = await getHolidays(date, date);
    if (holidays.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot record attendance on a holiday. ${date} is a public holiday.`
      });
    }
    // Reject on weekends
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({
        success: false,
        message: `Cannot record attendance on a weekend.`
      });
    }

    const attendance = await Attendance.update(id, req.body);

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error updating attendance:", error);
    if (error.code === "23503") {
      return res.status(400).json({ success: false, message: "Employee not found" });
    }
    res.status(500).json({ success: false, message: "Failed to update attendance record" });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.delete(id);

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ success: false, message: "Failed to delete attendance record" });
  }
};

const checkIn = async (req, res) => {
  try {
    const { employeeId } = req.params;
    // Reject check-in on holidays or weekends
    const today = new Date();
    const todayStr = toDateString(today);
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ success: false, message: "Cannot check in on a weekend." });
    }
    const holidays = await getHolidays(todayStr, todayStr);
    if (holidays.length > 0) {
      return res.status(400).json({ success: false, message: "Cannot check in on a public holiday." });
    }
    const attendance = await Attendance.checkIn(parseInt(employeeId));
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error checking in:", error);
    if (error.message === "Employee already checked in today") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Failed to check in" });
  }
};

const checkOut = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const attendance = await Attendance.checkOut(parseInt(employeeId));
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error checking out:", error);
    if (
      error.message === "No attendance record found for today" ||
      error.message === "Employee already checked out today"
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Failed to check out" });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const attendanceRecords = await Attendance.todayAttendance({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search || ''
    });
    res.json({ success: true, ...attendanceRecords });
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ success: false, message: "Failed to fetch today's attendance" });
  }
};

const getAnomalies = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const anomalies = await Attendance.getAnomalies({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search || ''
    });
    res.json({ success: true, ...anomalies });
  } catch (error) {
    console.error("Error fetching anomalies:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attendance anomalies" });
  }
};

const validateAnomaly = async (req, res) => {
  try {
    const { id } = req.params;
    const { validation_status, justification_reason } = req.body;
    
    if (!validation_status) {
      return res.status(400).json({ success: false, message: "Validation status is required" });
    }

    const attendance = await Attendance.validateAnomaly(id, validation_status, justification_reason || null);
    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error validating anomaly:", error);
    res.status(500).json({ success: false, message: "Failed to validate anomaly" });
  }
};

const getEmployeeAttendanceByMonth = async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;

    // Check permissions: employees can only view their own history
    if (req.user.role === "employee" && req.user.employee_id !== parseInt(employeeId, 10)) {
      return res.status(403).json({ success: false, message: "Access forbidden: you can only view your own attendance history" });
    }

    const records = await Attendance.getByEmployeeIdAndMonth(
      parseInt(employeeId, 10),
      parseInt(year, 10),
      parseInt(month, 10)
    );

    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching employee attendance history:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attendance history" });
  }
};

module.exports = {
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  checkIn,
  checkOut,
  getTodayAttendance,
  getAnomalies,
  validateAnomaly,
  getEmployeeAttendanceByMonth
};
