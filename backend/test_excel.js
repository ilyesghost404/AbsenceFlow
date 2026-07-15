require('dotenv').config();
const reportService = require('./src/services/reportService');
const fs = require('fs');

async function test() {
    try {
        const workbook = await reportService.generateMonthlyMatrixReport(2026, 7);
        await workbook.xlsx.writeFile('../test_matrix.xlsx');
        console.log("SUCCESS!");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
