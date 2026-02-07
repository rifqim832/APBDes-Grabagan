const ExcelJS = require('exceljs');
const fs = require('fs');

exports.parseExcel = async (req, res) => {
    console.log('Received parse request');
    console.log('req.file:', req.file);

    if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log('Processing file at:', filePath);
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(filePath);
        console.log('Workbook read successfully');
        let worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            console.log("Worksheet 1 not found, trying worksheets[0]");
            worksheet = workbook.worksheets[0];
        }

        if (!worksheet) {
            throw new Error("No worksheets found in Excel file");
        }
        console.log(`Worksheet found: ${worksheet.name}, rows: ${worksheet.rowCount}`);

        let colMap = { no: -1, spm: -1, kegiatan: -1, anggaran: -1, ket: -1 };
        let headerFound = false;
        let dataStartRow = -1;
        const dataSPM = [];
        const seenSPM = new Set();
        let totalBudget = 0;

        let dataCounter = 1;
        let stopParsing = false; // Flag to stop parsing upon footer detection

        worksheet.eachRow((row, rowNumber) => {
            // 1. CARI HEADER (Jika belum ketemu)
            if (!headerFound) {
                row.eachCell((cell, colNumber) => {
                    const val = cell.value?.toString().toLowerCase().trim() || "";
                    if (val === 'no') colMap.no = colNumber;
                    if (val.includes('nomor spm') || (val.includes('spm') && val.length < 15)) colMap.spm = colNumber;
                    if (val.includes('kegiatan')) colMap.kegiatan = colNumber;
                    if (val.includes('anggaran') || val.includes('jumlah') || val.includes('nilai')) colMap.anggaran = colNumber;
                    if (val === 'ket' || val.includes('keterangan')) colMap.ket = colNumber;
                });

                // Set header found if critical columns exist
                if (colMap.no !== -1 && (colMap.spm !== -1 || colMap.kegiatan !== -1) && colMap.anggaran !== -1) {
                    console.log(`Header found at Row ${rowNumber}:`, colMap);
                    headerFound = true;
                    dataStartRow = rowNumber + 1;
                } else {
                    // Reset to avoid partial match (safe since headers usually align)
                    colMap = { no: -1, spm: -1, kegiatan: -1, anggaran: -1, ket: -1 };
                }
                return;
            }

            // 2. DETEKSI KATA PENGHENTI (STOP WORDS)
            if (stopParsing) return;

            const rowStr = row.values.join(" ").toLowerCase();
            const stopWords = ["jumlah", "total", "demikian", "mengetahui", "lampiran"];

            // Check if any stop word exists in the row string
            if (stopWords.some(word => rowStr.includes(word))) {
                console.log(`Stop word found at Row ${rowNumber}: ${rowStr.substring(0, 50)}...`);
                stopParsing = true;
                return;
            }

            // 3. AMBIL DATA
            if (rowNumber >= dataStartRow) {
                const spmVal = colMap.spm !== -1 ? row.getCell(colMap.spm).value?.toString().trim() || "" : "";

                // VALIDASI UTAMA: Baris dianggap valid jika Nomor SPM-nya panjang (bukan helper row '2' dsb)
                if (spmVal.length > 5 && !seenSPM.has(spmVal)) {

                    // Ambil No (Use fallback counter if empty/invalid)
                    const rawNo = colMap.no !== -1 ? row.getCell(colMap.no).value : null;
                    const finalNo = (rawNo && !isNaN(parseFloat(rawNo))) ? parseInt(rawNo) : dataCounter;

                    // Ambil Kegiatan
                    let kegiatanVal = "";
                    if (colMap.kegiatan !== -1) {
                        kegiatanVal = row.getCell(colMap.kegiatan).value?.toString().trim() || "";
                    }

                    // Ambil Anggaran (Handle Formula/String)
                    let parsedAmount = 0;
                    if (colMap.anggaran !== -1) {
                        const cell = row.getCell(colMap.anggaran);
                        if (cell.type === ExcelJS.ValueType.Formula) {
                            parsedAmount = cell.result; // exceljs often puts result here
                        }

                        // Fallback check cell.value if result is null or directly value
                        if (!parsedAmount && typeof cell.value === 'number') {
                            parsedAmount = cell.value;
                        } else if (!parsedAmount && cell.value && typeof cell.value === 'object' && cell.value.result) {
                            parsedAmount = cell.value.result;
                        }

                        // Parse string if still not number
                        if (!parsedAmount && typeof cell.value === 'string') {
                            const cleanString = cell.value.replace(/[Rp\s.]/g, '').replace(',', '.');
                            parsedAmount = parseFloat(cleanString);
                        }
                    }

                    if (parsedAmount && !isNaN(parsedAmount)) {
                        totalBudget += Number(parsedAmount);
                    }

                    dataSPM.push({
                        no: finalNo,
                        nomor_spm: spmVal,
                        kegiatan: kegiatanVal,
                        anggaran: parsedAmount || 0,
                        keterangan: colMap.ket !== -1 ? row.getCell(colMap.ket).value?.toString().trim() || "" : ""
                    });

                    seenSPM.add(spmVal);
                    dataCounter++; // Increment counter for next valid row
                }
            }
        });

        console.log(`Parsing complete. Found ${dataSPM.length} entries. Total: ${totalBudget}`);

        // Metadata is manual input now
        const finalMetadata = {
            desa: "",
            nomorSurat: ""
        };

        // Clean up uploads
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error('Error deleting temp file:', err);
        }

        res.json({
            metadata: finalMetadata,
            data: {
                activities: dataSPM,
                totalBudget: totalBudget
            }
        });

    } catch (error) {
        console.error('Error processing Excel:', error);
        res.status(500).json({ error: 'Gagal memproses file Excel: ' + error.message });
    }
};
