const axios = require('axios');
const ExcelJS = require('exceljs');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
    // 1. Create dummy excel
    // 1. Create dummy excel matching user format
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');

    // Fill dummy rows up to 17
    for (let i = 1; i < 18; i++) {
        sheet.addRow(['Filler', 'Filler', 'Filler', 'Filler', 'Filler', 'Filler', 'Filler', 'Filler']);
    }

    // Row 18: Data
    // E=5, H=8
    const row18 = sheet.getRow(18);
    row18.getCell(5).value = 'Pembangunan Jalan Usaha Tani';
    row18.getCell(8).value = '6.000.000,00'; // String format as seen in screenshot (approx)
    row18.commit();

    const row19 = sheet.getRow(19);
    row19.getCell(5).value = 'Operasional Posyandu';
    row19.getCell(8).value = 4500000; // Number format
    row19.commit();

    await workbook.xlsx.writeFile('test.xlsx');
    console.log('Created test.xlsx with 18+ rows');

    // 2. Upload
    const form = new FormData();
    form.append('file', fs.createReadStream('test.xlsx'));

    try {
        const response = await axios.post('http://localhost:3000/api/parsing/parse-excel', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

test();
