// Reload trigger: environment variables updated
const app = require("./app");
const { checkDatabaseConnection } = require("./config/database");
const { runAttendanceScheduler } = require("./services/attendanceScheduler");

const PORT = 5000;

app.listen(PORT, async () => {
    console.log(`AbsenceFlow API running on port ${PORT}`);

    // Verify database connection before starting services
    const dbConnected = await checkDatabaseConnection();

    if (dbConnected) {
        runAttendanceScheduler();
    } else {
        console.warn("⚠️  Server is running but database is unreachable. Some features will not work.");
        console.warn("   Start PostgreSQL and restart the server.\n");
    }
});
