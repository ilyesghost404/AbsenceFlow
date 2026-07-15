const ExcelJS = require('exceljs');

async function test() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('../test_matrix.xlsx');
    const worksheet = workbook.getWorksheet(1);
    
    for (let i = 1; i <= 6; i++) {
        const row = worksheet.getRow(i);
        console.log(`Row ${i}:`);
        row.eachCell((cell, colNumber) => {
            console.log(`  Col ${colNumber}: ${cell.value}`);
        });
    }
}
test();
