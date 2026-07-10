const app = require("./app");
const { runAttendanceScheduler } = require("./services/attendanceScheduler");

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`AbsenceFlow API running on port ${PORT}`);
    runAttendanceScheduler();
});

