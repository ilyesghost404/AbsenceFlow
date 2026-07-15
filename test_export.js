const { db } = require('./backend/src/config/database');
const reportService = require('./backend/src/services/reportService');
const fs = require('fs');

async function run() {
    try {
        const workbook = await reportService.generateMonthlyMatrixReport(2026, 7);
        await workbook.xlsx.writeFile('test_matrix.xlsx');
        console.log("Success! File saved to test_matrix.xlsx");
    } catch (e) {
        console.error("Error generating report:", e);
    } finally {
        process.exit(0);
    }
}
run();
