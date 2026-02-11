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
            if (stopParsing) return;
            const rowStr = row.values.join(" ").toLowerCase();

            // 1. CARI HEADER (Dynamic Column Mapping)
            if (!headerFound) {
                row.eachCell((cell, colNumber) => {
                    const val = cell.value?.toString().toLowerCase().trim() || "";
                    if (val === 'no') colMap.no = colNumber;
                    if (val.includes('nomor spm')) colMap.spm = colNumber;
                    // 'kegiatan' is implicit, between SPM and Anggaran
                    if (val.includes('anggaran') || val.includes('jumlah') || val.includes('nilai')) colMap.anggaran = colNumber;
                    if (val === 'ket' || val.includes('keterangan')) colMap.ket = colNumber;
                });

                if (colMap.no !== -1 && colMap.spm !== -1 && colMap.anggaran !== -1) {
                    console.log(`Header found at Row ${rowNumber}:`, colMap);
                    headerFound = true;
                    // We don't need explicit 'kegiatan' column anymore because we SCAN between SPM and Anggaran
                }
                return;
            }

            // 2. DETEKSI STOP WORDS
            if (rowStr.includes("jumlah") || rowStr.includes("total") || rowStr.includes("demikian")) {
                stopParsing = true;
                return;
            }

            // 3. AMBIL DATA
            const spmVal = colMap.spm !== -1 ? row.getCell(colMap.spm).value?.toString().trim() || "" : "";

            // VALIDASI UTAMA: Valid SPM > 5 chars (e.g., "00001/01/...")
            if (spmVal.length > 5 && !seenSPM.has(spmVal)) {

                // --- LOGIKA SCAN AREA UNTUK KEGIATAN ---
                // Scan all cells between SPM column and Anggaran column
                let combinedKegiatan = [];
                // Start from SPM+1, End at Anggaran-1
                if (colMap.spm !== -1 && colMap.anggaran !== -1) {
                    for (let i = colMap.spm + 1; i < colMap.anggaran; i++) {
                        const cell = row.getCell(i);
                        const cellVal = cell.value;

                        if (cellVal) {
                            // Extract string first
                            const term = (typeof cellVal === 'object' && cellVal.richText)
                                ? cellVal.richText.map(rt => rt.text).join("")
                                : cellVal.toString();

                            // Prevent duplication from merged cells
                            if (cell.isMerged) {
                                // Only push if this is the master cell of the merge
                                if (cell.address === cell.master.address) {
                                    combinedKegiatan.push(term.trim());
                                }
                            } else {
                                // Add directly if not merged
                                combinedKegiatan.push(term.trim());
                            }
                        }
                    }
                }
                const kegiatanFinal = combinedKegiatan.join(" "); // Merge found text

                // Ambil Anggaran (Robust)
                let parsedAmount = 0;
                if (colMap.anggaran !== -1) {
                    const cell = row.getCell(colMap.anggaran);
                    if (cell.type === ExcelJS.ValueType.Formula) {
                        parsedAmount = cell.result;
                    } else if (typeof cell.value === 'number') {
                        parsedAmount = cell.value;
                    } else if (cell.value && typeof cell.value === 'object' && cell.value.result) {
                        parsedAmount = cell.value.result;
                    } else if (typeof cell.value === 'string') {
                        const cleanString = cell.value.replace(/[Rp\s.]/g, '').replace(',', '.');
                        parsedAmount = parseFloat(cleanString);
                    }
                }

                if (parsedAmount && !isNaN(parsedAmount)) {
                    totalBudget += Number(parsedAmount);
                }

                // Ambil No (Fallback Counter)
                const rawNo = colMap.no !== -1 ? row.getCell(colMap.no).value : null;
                const finalNo = (rawNo && !isNaN(parseFloat(rawNo))) ? parseInt(rawNo) : dataCounter;

                dataSPM.push({
                    no: finalNo,
                    nomor_spm: spmVal,
                    kegiatan: kegiatanFinal, // Result of Scan Area
                    anggaran: parsedAmount || 0,
                    keterangan: colMap.ket !== -1 ? row.getCell(colMap.ket).value?.toString().trim() || "" : ""
                });

                seenSPM.add(spmVal);
                dataCounter++;
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
