const Attendance = require("../models/Attendance");
const FaceProfile = require("../models/FaceProfile");
const FaceSecurityLog = require("../models/FaceSecurityLog");
const QrSession = require("../models/QrSession");
const { getHolidays, toDateString } = require("../services/attendanceService");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UAParser = require("ua-parser-js");

const JWT_SECRET = process.env.JWT_SECRET || "absenceflow_jwt_secret_key_12345";
const processingTokens = new Set();

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

const verifyFace = async (req, res) => {
  try {
    const { image, employeeId } = req.body;

    if (!employeeId || !image) {
      return res.status(400).json({ success: false, message: "Employee ID and image are required" });
    }

    const profile = await FaceProfile.getByEmployeeId(employeeId);
    if (!profile) {
      return res.status(400).json({ success: false, message: "No face profile registered for this employee." });
    }

    let storedEmbedding = profile.face_embedding;
    if (typeof storedEmbedding === 'string') {
      try { storedEmbedding = JSON.parse(storedEmbedding); } catch(e) {}
    }

    if (!storedEmbedding || !Array.isArray(storedEmbedding) || storedEmbedding.length === 0) {
      console.error(`❌ [Face Verification] Biometric profile missing or malformed for employee_id=${employeeId}:`, storedEmbedding);
      return res.status(400).json({ success: false, message: "Biometric profile is missing or invalid. Please re-register your Face ID." });
    }

    console.log(`🔍 [Face Verification] Employee ID: ${employeeId}`);
    console.log(`   Stored Embedding Length: ${storedEmbedding.length}`);

    // Call Local AI Service
    let aiResponse;
    try {
      aiResponse = await fetch("http://localhost:5001/api/ai/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, embedding: storedEmbedding })
      });
    } catch (err) {
      console.error("❌ AI Microservice connection failed:", err);
      return res.status(502).json({ success: false, message: "AI Face Microservice is offline or unreachable." });
    }

    const aiResult = await aiResponse.json();
    if (!aiResponse.ok || !aiResult.success) {
      const reason = aiResult.reason || "Face verification failed";
      await FaceSecurityLog.record(employeeId, 'VERIFY', 'FAILED', null);
      return res.status(400).json({ success: false, message: reason, reason: aiResult.reason });
    }

    if (!aiResult.liveness) {
      await FaceSecurityLog.record(employeeId, 'VERIFY', 'FAILED_LIVENESS', null);
      return res.status(400).json({ 
        success: false, 
        message: "Liveness verification failed.", 
        reason: "LIVENESS_FAILED" 
      });
    }

    if (!aiResult.match) {
      await FaceSecurityLog.record(employeeId, 'VERIFY', 'FAILED_MATCH', aiResult.confidence);
      return res.status(400).json({ 
        success: false, 
        message: aiResult.message || "Face recognition failed.", 
        reason: aiResult.reason || "FACE_NOT_MATCHED"
      });
    }

    await FaceSecurityLog.record(employeeId, 'VERIFY', 'SUCCESS', aiResult.confidence);

    // Generate signed faceToken
    const faceToken = jwt.sign(
      { employeeId, faceVerified: true, confidence: aiResult.confidence },
      process.env.JWT_SECRET || "absenceflow_jwt_secret_key_12345",
      { expiresIn: '10m' }
    );

    await FaceProfile.recordVerification(employeeId);

    res.json({
      success: true,
      match: true,
      confidence: aiResult.confidence,
      liveness: true,
      faceToken
    });
  } catch (error) {
    console.error("Local AI verifyFace Error:", error);
    res.status(500).json({ success: false, message: "An error occurred during AI face verification." });
  }
};

const createQr = async (req, res) => {
  try {
    // Manager or Admin only
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: "Access forbidden: only managers or admins can generate QR codes" });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute

    const qrSession = await QrSession.create(1, token, expiresAt);

    res.status(201).json({
      success: true,
      qrToken: token,
      expiresAt
    });
  } catch (error) {
    console.error("Create QR error:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR code session" });
  }
};

const verifyQr = async (req, res) => {
  console.log("🔍 [Verify QR Endpoint] Received verify request. Token:", req.body.qrToken);
  try {
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ success: false, message: "QR token is required" });
    }

    if (processingTokens.has(qrToken)) {
      return res.status(429).json({ success: false, message: "QR code is currently being processed. Please wait." });
    }

    const session = await QrSession.getByToken(qrToken);
    if (!session) {
      return res.status(400).json({ success: false, message: "Invalid or expired QR code" });
    }

    if (session.used) {
      return res.status(400).json({ success: false, message: "This QR code has already been used" });
    }

    const expiry = new Date(session.expires_at);
    if (expiry < new Date()) {
      return res.status(400).json({ success: false, message: "This QR code has expired" });
    }

    res.json({ success: true, valid: true });
  } catch (error) {
    console.error("Verify QR error:", error);
    res.status(500).json({ success: false, message: "Failed to verify QR code" });
  }
};

const checkInWithAI = async (req, res) => {
  console.log("🔍 [Check In AI Endpoint] Received request. faceToken length:", req.body.faceToken?.length, "qrToken:", req.body.qrToken);
  const { faceToken, qrToken, deviceInfo } = req.body;
  if (!faceToken || !qrToken) {
    return res.status(400).json({ success: false, message: "Face verification and QR verification tokens are required" });
  }

  if (processingTokens.has(qrToken)) {
    return res.status(429).json({ success: false, message: "Check-in is currently processing. Please wait." });
  }
  processingTokens.add(qrToken);

  try {
    // Decode and verify faceToken
    let decodedFace;
    try {
      decodedFace = jwt.verify(faceToken, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid or expired face verification token. Please verify your face again." });
    }

    // Security: Verify faceToken matches the logged-in user
    if (req.user.role === 'employee' && req.user.employee_id !== decodedFace.employeeId) {
      return res.status(403).json({ success: false, message: "Biometric profile mismatch. You can only check in for yourself." });
    }

    // Verify qrToken
    const session = await QrSession.getByToken(qrToken);
    if (!session) {
      return res.status(400).json({ success: false, message: "Invalid or expired QR code" });
    }
    if (session.used) {
      return res.status(400).json({ success: false, message: "This QR code has already been used" });
    }
    const expiry = new Date(session.expires_at);
    if (expiry < new Date()) {
      return res.status(400).json({ success: false, message: "This QR code has expired" });
    }

    const employeeId = decodedFace.employeeId;

    // Reject attendance on holidays or weekends (existing rules)
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

    // Get device info
    const uap = new UAParser(req.headers["user-agent"]);
    const browser = uap.getBrowser().name || "Unknown Browser";
    const os = uap.getOS().name || "Unknown OS";
    const finalDeviceInfo = deviceInfo || `${browser} on ${os}`;

    // Perform Check-in in DB
    const attendance = await Attendance.checkInWithAI(
      employeeId,
      decodedFace.confidence,
      session.id,
      finalDeviceInfo
    );

    // Mark QR session as used
    await QrSession.markAsUsed(session.id);

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("AI Check-in error:", error);
    if (error.message === "Employee already checked in today") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Failed to check in via AI/QR" });
  } finally {
    processingTokens.delete(qrToken);
  }
};

const checkOutWithAI = async (req, res) => {
  console.log("🔍 [Check Out AI Endpoint] Received request. faceToken length:", req.body.faceToken?.length, "qrToken:", req.body.qrToken);
  const { faceToken, qrToken, deviceInfo } = req.body;
  if (!faceToken || !qrToken) {
    return res.status(400).json({ success: false, message: "Face verification and QR verification tokens are required" });
  }

  if (processingTokens.has(qrToken)) {
    return res.status(429).json({ success: false, message: "Check-out is currently processing. Please wait." });
  }
  processingTokens.add(qrToken);

  try {
    // Decode and verify faceToken
    let decodedFace;
    try {
      decodedFace = jwt.verify(faceToken, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid or expired face verification token. Please verify your face again." });
    }

    // Security: Verify faceToken matches the logged-in user
    if (req.user.role === 'employee' && req.user.employee_id !== decodedFace.employeeId) {
      return res.status(403).json({ success: false, message: "Biometric profile mismatch. You can only check out for yourself." });
    }

    // Verify qrToken
    const session = await QrSession.getByToken(qrToken);
    if (!session) {
      return res.status(400).json({ success: false, message: "Invalid or expired QR code" });
    }
    if (session.used) {
      return res.status(400).json({ success: false, message: "This QR code has already been used" });
    }
    const expiry = new Date(session.expires_at);
    if (expiry < new Date()) {
      return res.status(400).json({ success: false, message: "This QR code has expired" });
    }

    const employeeId = decodedFace.employeeId;

    // Get device info
    const uap = new UAParser(req.headers["user-agent"]);
    const browser = uap.getBrowser().name || "Unknown Browser";
    const os = uap.getOS().name || "Unknown OS";
    const finalDeviceInfo = deviceInfo || `${browser} on ${os}`;

    // Perform Check-out in DB
    const attendance = await Attendance.checkOutWithAI(
      employeeId,
      decodedFace.confidence,
      session.id,
      finalDeviceInfo
    );

    // Mark QR session as used
    await QrSession.markAsUsed(session.id);

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("AI Check-out error:", error);
    if (
      error.message === "No attendance record found for today" ||
      error.message === "Employee already checked out today"
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Failed to check out via AI/QR" });
  } finally {
    processingTokens.delete(qrToken);
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
  getEmployeeAttendanceByMonth,
  verifyFace,
  createQr,
  verifyQr,
  checkInWithAI,
  checkOutWithAI
};
