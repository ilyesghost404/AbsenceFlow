const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const db = require("./config/database");

const employeeRoutes = require("./routes/employeeRoutes");
const absenceRoutes = require("./routes/absenceRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// Security Middlewares
app.use(helmet()); // Sets various HTTP headers for security

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10kb" })); // Body limit to prevent large payload attacks

// Rate Limiting
const isDev = process.env.NODE_ENV !== "production";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests / 15 min for prod
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Disable global rate limiting entirely in development
    if (isDev) return true;
    
    // Skip auth routes so they don't count towards the general API limit
    return req.path.includes('/login') || req.path.includes('/forgot-password') || req.path.includes('/reset-password');
  },
  handler: (req, res, next, options) => {
    const remainingSeconds = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    res.status(options.statusCode).json({ 
      success: false, 
      message: `Too many requests from this IP, please try again in ${minutes}m ${seconds}s.`,
      retryAfterSeconds: remainingSeconds,
      remainingAttempts: req.rateLimit.remaining
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50 : 10, // 10 attempts / 15 min for prod, 50 for dev
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const remainingSeconds = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    res.status(options.statusCode).json({ 
      success: false, 
      message: `Too many authentication attempts, please try again in ${minutes}m ${seconds}s.`,
      retryAfterSeconds: remainingSeconds,
      remainingAttempts: req.rateLimit.remaining
    });
  }
});

// Endpoint to reset rate limits for admin/development
app.post("/api/admin/reset-rate-limit", (req, res) => {
  const targetIp = req.body.ip || req.ip;
  apiLimiter.resetKey(targetIp);
  authLimiter.resetKey(targetIp);
  res.json({ success: true, message: `Rate limit reset for IP: ${targetIp}` });
});

app.use("/api/", apiLimiter);
app.use("/api/users/login", authLimiter);
app.use("/api/users/forgot-password", authLimiter);
app.use("/api/users/reset-password", authLimiter);


// Test API route
app.get("/", (req, res) => {
  res.json({
    message: "AbsenceFlow API is running"
  });
});


// PostgreSQL connection test
app.get("/api/test-db", async (req, res) => {

  try {

    const result = await db.query("SELECT NOW()");

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }

});


// User management and auth routes
app.use("/api/users", userRoutes);

// Dashboard routes
app.use("/api/dashboard", dashboardRoutes);

// Employee routes
app.use("/api/employees", employeeRoutes);

// Absence routes
app.use("/api/absences", absenceRoutes);

// Presence/Attendance routes
app.use("/api/presence", attendanceRoutes);

// Attendance routes (for attendance calculation)
app.use("/api/attendance", attendanceRoutes);

// Report routes
app.use("/api/reports", reportRoutes);

// Holiday routes
app.use("/api/holidays", holidayRoutes);

// Settings routes
app.use("/api/settings", settingsRoutes);



module.exports = app;
