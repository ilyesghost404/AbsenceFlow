const express = require("express");
const cors = require("cors");
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


// Middlewares
app.use(cors());
app.use(express.json());


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
