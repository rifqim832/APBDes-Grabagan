const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

// ============================================================
// IMAGE PARSING (OCR) - Advanced Pipeline
// Sharp Pre-processing + Tesseract.js + Heuristic Parsing
// ============================================================

// ======================== UTILITY FUNCTIONS ========================

/**
 * Koreksi karakter OCR yang sering salah baca
 * Menangani kesalahan umum pada konteks SPM/dokumen keuangan
 */
const correctOcrText = (text) => {
    return text
        .replace(/[|¦¢]/g, '/')       // pipe, broken-bar, cent → slash (visual lookalikes)
        .replace(/\\/g, '/')            // backslash → slash
        .replace(/[''`´]/g, '')         // stray quotes
        .replace(/[—–-]{2,}/g, '-')     // multiple dashes → single
        .replace(/\s{3,}/g, '  ')       // normalize excessive spaces to double
        .trim();
};

/**
 * Koreksi angka OCR yang salah baca  
 * Contoh: 'O' → '0', 'l'/'I' → '1', 'S' → '5', 'B' → '8'
 */
const correctOcrDigits = (str) => {
    return str
        .replace(/[oO]/g, '0')
        .replace(/[lI]/g, '1')
        .replace(/[zZ]/g, '2')
        .replace(/[S\$]/g, '5')
        .replace(/[B]/g, '8')
        .replace(/[g]/g, '9');
};

/**
 * Parsing nominal anggaran dari string OCR — sangat toleran terhadap noise
 * Mendukung: 1.000.000 / 1,000,000 / 1000000 / Rp 1.000.000 / Rp1.000.000,00
 */
const parseAmount = (str) => {
    if (!str) return 0;

    // Koreksi digit OCR terlebih dahulu
    let cleaned = correctOcrDigits(str);

    // Hapus prefix Rp dan whitespace
    cleaned = cleaned.replace(/[Rp\s]/gi, '').trim();

    // Hapus semua karakter non-numerik kecuali titik dan koma
    cleaned = cleaned.replace(/[^\d.,]/g, '');

    if (!cleaned) return 0;

    // === DETEKSI FORMAT ===
    // Format Indonesia: 1.000.000 (titik = ribuan)
    // Format campuran: 1.000.000,00 (titik = ribuan, koma = desimal)
    // Format internasional: 1,000,000.00 (koma = ribuan, titik = desimal)

    const dots = (cleaned.match(/\./g) || []).length;
    const commas = (cleaned.match(/,/g) || []).length;

    if (dots > 0 && commas === 0) {
        // Cek apakah titik = pemisah ribuan (semua segmen setelah titik = 3 digit)
        const segments = cleaned.split('.');
        const allThreeDigit = segments.slice(1).every(s => s.length === 3);
        if (allThreeDigit || segments[segments.length - 1].length === 3) {
            cleaned = cleaned.replace(/\./g, ''); // titik = ribuan
        }
        // else: titik = desimal (misal: 1000.50)
    } else if (dots > 0 && commas > 0) {
        // Tentukan mana yang ribuan berdasarkan posisi terakhir
        const lastDot = cleaned.lastIndexOf('.');
        const lastComma = cleaned.lastIndexOf(',');
        if (lastComma > lastDot) {
            // Format: 1.000.000,00 → titik = ribuan, koma = desimal
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            // Format: 1,000,000.00 → koma = ribuan
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (commas > 0 && dots === 0) {
        // Koma saja — cek apakah ribuan atau desimal
        const segments = cleaned.split(',');
        if (segments.length > 2 || segments[segments.length - 1].length === 3) {
            cleaned = cleaned.replace(/,/g, ''); // koma = ribuan
        } else {
            cleaned = cleaned.replace(',', '.'); // koma = desimal
        }
    }

    const result = parseFloat(cleaned);
    return isNaN(result) ? 0 : result;
};

/**
 * Validasi dan koreksi nomor SPM
 * Format SPM umum: 00001/01/LS/2024, 900/xxx/414.420/2024, dll.
 */
const validateSpmNumber = (raw) => {
    if (!raw) return '';
    let spm = raw.trim();

    // Koreksi karakter slash yang salah baca
    spm = spm.replace(/[|¦\\]/g, '/');

    // Hapus spasi di sekitar slash
    spm = spm.replace(/\s*\/\s*/g, '/');

    // Hapus karakter non-printable
    spm = spm.replace(/[^\x20-\x7E]/g, '');

    return spm;
};

// ======================== IMAGE PRE-PROCESSING ========================

/**
 * STEP 1: Advanced Image Pre-processing Pipeline v3.0
 * 
 * Tahapan:
 * 1. Scaling → upscale ke ~300 DPI equivalent
 * 2. Grayscale + Contrast Stretching (CLAHE-like)
 * 3. Morphological Ops → HAPUS GARIS TABEL (border removal)
 * 4. Sharpen + Noise Removal
 * 5. Adaptive Binarization (Otsu simulation)
 */
const preprocessImage = async (filePath) => {
    console.log('[PRE-PROCESS] Memulai advanced pre-processing v3.0...');

    const metadata = await sharp(filePath).metadata();
    console.log(`[PRE-PROCESS] Input: ${metadata.width}x${metadata.height}, format: ${metadata.format}, density: ${metadata.density || 'unknown'} DPI`);

    // --- STEP 1: SCALING KE 300 DPI ---
    const TARGET_WIDTH = 2480;
    let scaleFactor = 1;
    if (metadata.width < TARGET_WIDTH) {
        scaleFactor = Math.min(TARGET_WIDTH / metadata.width, 3);
        console.log(`[PRE-PROCESS] Upscaling ${scaleFactor.toFixed(1)}x → ~300 DPI`);
    }

    const scaledWidth = Math.round(metadata.width * scaleFactor);

    // --- STEP 2: Grayscale + Aggressive Contrast Stretch ---
    console.log('[PRE-PROCESS] Contrast stretching...');
    const grayscaleBuffer = await sharp(filePath)
        .resize({ width: scaledWidth, kernel: sharp.kernel.lanczos3 })
        .greyscale()
        .normalize()                      // Auto histogram stretch
        .linear(1.8, -50)                 // CLAHE-like: boost contrast, darken text
        .png()
        .toBuffer();

    // --- STEP 3: MORPHOLOGICAL OPS — HAPUS GARIS TABEL ---
    // Garis tabel = penyebab utama Tesseract membaca |, I, _, -
    // Strategi: median filter besar (5px) → menghancurkan garis tipis 1-2px
    //           tapi mempertahankan teks yang lebih tebal (3-5px stroke)
    console.log('[PRE-PROCESS] Morphological ops (border removal)...');
    const borderlessBuffer = await sharp(grayscaleBuffer)
        .median(5)                        // Erode thin lines (1-2px borders)
        .sharpen({ sigma: 2.5, m1: 2, m2: 0.5 }) // Re-sharpen text edges
        .median(3)                        // Final noise cleanup
        .png()
        .toBuffer();

    // --- STEP 4: ADAPTIVE BINARIZATION (Otsu Simulation) ---
    console.log('[PRE-PROCESS] Adaptive Binarization (multi-threshold)...');
    const THRESHOLDS = [110, 130, 150, 170, 190];
    const variants = [];

    for (const thresh of THRESHOLDS) {
        const buffer = await sharp(borderlessBuffer)
            .threshold(thresh)
            .png()
            .toBuffer();

        const { channels } = await sharp(buffer).stats();
        const meanBrightness = channels[0]?.mean || 128;
        const blackRatio = 1 - (meanBrightness / 255);

        // Optimal: 10-20% black (teks saja, tanpa border)
        const score = 1 - Math.abs(blackRatio - 0.15);
        variants.push({ threshold: thresh, buffer, blackRatio, score });
        console.log(`  Threshold ${thresh}: black=${(blackRatio * 100).toFixed(1)}%, score=${score.toFixed(3)}`);
    }

    variants.sort((a, b) => b.score - a.score);
    const best = variants[0];
    console.log(`[PRE-PROCESS] Best threshold: ${best.threshold} (black=${(best.blackRatio * 100).toFixed(1)}%)`);

    // --- VARIANT: Soft grayscale (no binarization, border removed) ---
    const softVariant = await sharp(borderlessBuffer)
        .linear(1.3, -20)
        .png()
        .toBuffer();

    // --- VARIANT: Original grayscale (with borders, for fallback) ---
    const originalGrayscale = await sharp(grayscaleBuffer)
        .sharpen({ sigma: 1.5 })
        .png()
        .toBuffer();

    console.log(`[PRE-PROCESS] Selesai. Best: ${(best.buffer.length / 1024).toFixed(0)}KB`);

    return {
        bestBinarized: best.buffer,
        bestThreshold: best.threshold,
        softVariant,
        originalGrayscale,
        originalMetadata: metadata,
        scaleFactor
    };
};

// ======================== OCR ENGINE ========================

/**
 * Jalankan OCR pada buffer gambar dengan parameter konfigurasi
 * @param {Buffer} imageBuffer - Gambar yang sudah diproses
 * @param {string} label - Label untuk logging
 * @param {object} extraParams - Parameter Tesseract tambahan (PSM, whitelist, dll)
 */
const runOcr = async (imageBuffer, label = '', extraParams = {}) => {
    console.log(`[OCR${label ? ' ' + label : ''}] Memulai recognition...`);

    // Default: PSM 6 (single uniform block) — optimal untuk tabel
    // preserve_interword_spaces: pertahankan alignment kolom
    const defaultParams = {
        tessedit_pageseg_mode: '6',         // PSM 6: single block, baris demi baris
        preserve_interword_spaces: '1',     // Jaga spasi antar kolom
        user_defined_dpi: '300',            // Inform Tesseract we're at 300 DPI
    };

    const params = { ...defaultParams, ...extraParams };
    console.log(`[OCR${label}] Config: PSM=${params.tessedit_pageseg_mode}, DPI=${params.user_defined_dpi}`);

    const { data } = await Tesseract.recognize(imageBuffer, 'ind+eng', {
        logger: m => {
            if (m.status === 'recognizing text') {
                process.stdout.write(`\r  [OCR${label}] Progress: ${(m.progress * 100).toFixed(0)}%`);
            }
        },
        ...params
    });
    console.log(''); // newline after progress

    console.log(`[OCR${label}] Confidence: ${data.confidence?.toFixed(1) || 'N/A'}%`);
    console.log(`[OCR${label}] Words found: ${data.words?.length || 0}`);
    return data;
};

// ======================== TABLE PARSER ========================

/**
 * Bersihkan artefak garis tabel dari teks OCR
 * Tesseract sering membaca border tabel sebagai: | I l _ - = +
 */
const cleanBorderArtifacts = (line) => {
    return line
        .replace(/[|¦]{1,}/g, ' ')          // Garis vertikal → spasi
        .replace(/_{3,}/g, ' ')              // Garis horizontal panjang
        .replace(/-{3,}/g, ' ')              // Dashes panjang  
        .replace(/={3,}/g, ' ')              // Equals panjang
        .replace(/\+{1,}/g, ' ')             // Corner crosses
        .replace(/[\[\]{}()]/g, '')          // Bracket artifacts
        .replace(/^[|\s_-]+/, '')            // Leading border chars
        .replace(/[|\s_-]+$/, '')            // Trailing border chars
        .replace(/\s{2,}/g, '  ')            // Normalize spaces
        .trim();
};

/**
 * STEP 3: Advanced Table Parsing with Heuristic + Regex Validation
 * 
 * Menggunakan 3 parsing methods + border artifact cleaning:
 * M1: Regex terstruktur (untuk tabel yang terbaca baik)
 * M2: Column-position parsing (untuk tabel dengan spacing tidak konsisten)
 * M3: Fuzzy single-line parsing (untuk baris yang terdeteksi parsial)
 */
const parseTableFromOcrText = (text) => {
    console.log('[PARSER] Memulai table reconstruction...');

    // STEP 0: Bersihkan artefak garis tabel dari seluruh teks
    const rawLines = text.split('\n');
    const textLines = rawLines
        .map(l => cleanBorderArtifacts(l))
        .map(l => l.trim())
        .filter(l => l.length > 0);
    console.log(`[PARSER] Total baris teks: ${textLines.length} (dari ${rawLines.length} raw lines)`);

    const dataSPM = [];
    let totalBudget = 0;
    let headerFound = false;
    let dataCounter = 1;
    let consecutiveEmptyDataLines = 0;

    for (let lineIdx = 0; lineIdx < textLines.length; lineIdx++) {
        const rawLine = textLines[lineIdx];
        const line = correctOcrText(rawLine);
        const lineLower = line.toLowerCase();

        // --- DETEKSI HEADER (lebih toleran) ---
        if (!headerFound) {
            const headerKeywords = ['nomor spm', 'no spm', 'no.spm', 'nospm', 'nomer spm'];
            const secondaryKeywords = ['kegiatan', 'anggaran', 'jumlah', 'uraian', 'nilai'];

            const hasMainKeyword = headerKeywords.some(k => lineLower.includes(k));
            const hasSecondary = secondaryKeywords.filter(k => lineLower.includes(k)).length >= 1;
            const hasSPMAndOther = lineLower.includes('spm') && hasSecondary;

            if (hasMainKeyword || hasSPMAndOther || (hasSecondary && lineLower.includes('no'))) {
                headerFound = true;
                console.log(`  [HEADER] Terdeteksi di baris ${lineIdx + 1}: "${line}"`);
            }
            continue;
        }

        // --- SKIP SUB-HEADER (baris nomor kolom "1 2 3 4 5") ---
        if (/^\d(\s+\d){2,}$/.test(line.trim())) {
            console.log(`  [SKIP] Sub-header: "${line}"`);
            continue;
        }

        // --- SKIP baris terlalu pendek ---
        if (line.length < 5) {
            consecutiveEmptyDataLines++;
            if (consecutiveEmptyDataLines > 3) {
                console.log(`  [STOP] Terlalu banyak baris kosong/pendek`);
                break;
            }
            continue;
        }
        consecutiveEmptyDataLines = 0;

        // --- STOP WORDS (footer tabel) ---
        if (/\b(jumlah|total|seluruhnya)\b/i.test(lineLower) ||
            lineLower.includes('demikian') || lineLower.includes('menjadikan periksa') ||
            lineLower.includes('mengetahui') || lineLower.includes('tanda tangan')) {
            console.log(`  [FOOTER] Terdeteksi: "${line.substring(0, 50)}..."`);
            break;
        }

        // ==========================================
        // PARSING BARIS DATA — 3 Methods
        // ==========================================
        let no = null;
        let spmNumber = '';
        let kegiatan = '';
        let anggaran = 0;
        let keterangan = '';
        let parsed = false;

        // === METHOD 1: Regex Terstruktur (paling akurat) ===
        // Pattern: NO(1-3digit) SPACE SPM(has /) SPACE KEGIATAN SPACE AMOUNT [KET]
        const m1 = line.match(
            /^(\d{1,3})\s{1,}(.{5,}?\/[^\s]*?)\s{2,}(.+?)\s{2,}([\d.,\s]{4,})\s*([A-Za-z]{2,5})?\s*$/
        );
        if (m1) {
            no = parseInt(m1[1]);
            spmNumber = validateSpmNumber(m1[2]);
            kegiatan = m1[3].trim();
            anggaran = parseAmount(m1[4]);
            keterangan = m1[5]?.trim() || '';
            parsed = true;
            console.log(`  [M1] Row ${dataCounter}: SPM="${spmNumber}" Amt=${anggaran}`);
        }

        // === METHOD 2: Token/Column-based Parsing ===
        if (!parsed) {
            // Split menggunakan multi-space ATAU tab
            const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(p => p.length > 0);

            if (parts.length >= 2) {
                let pIdx = 0;

                // [NO] - 1-3 digit angka di awal
                if (/^\d{1,3}[.\s]*$/.test(parts[0])) {
                    no = parseInt(parts[0].replace(/[^\d]/g, ''));
                    pIdx = 1;
                }

                // [NOMOR SPM] - harus mengandung "/" atau format numerik panjang
                if (pIdx < parts.length && (
                    parts[pIdx].includes('/') ||
                    /^\d{4,}/.test(parts[pIdx]) ||
                    parts[pIdx].length > 10
                )) {
                    spmNumber = validateSpmNumber(parts[pIdx]);
                    pIdx++;
                }

                // Sisa parts: parsing heuristik
                const remaining = parts.slice(pIdx);
                const kegParts = [];
                let amountFound = false;

                for (let i = remaining.length - 1; i >= 0; i--) {
                    const part = remaining[i];
                    const lowerPart = part.toLowerCase();

                    // Cek keterangan standar terlebih dahulu (biasanya di akhir)
                    if (!keterangan && /^(ADD|BL|BT|BTL|TU|LS|GU|SPP|UP|TBP)$/i.test(part)) {
                        keterangan = part.toUpperCase();
                        continue;
                    }

                    // Cek apakah ini nominal anggaran (baca dari belakang)
                    const partDigitsOnly = part.replace(/[^\d]/g, '');
                    if (!amountFound && /^[\d.,Rp\s]+$/.test(part) && partDigitsOnly.length >= 4) {
                        const parsedAmt = parseAmount(part);
                        if (parsedAmt > 0) {
                            anggaran = parsedAmt;
                            amountFound = true;
                            continue;
                        }
                    }

                    // Sisanya = kegiatan
                    kegParts.unshift(part);
                }

                kegiatan = kegParts.join(' ');

                if (spmNumber.length > 3 || kegiatan.length > 3) {
                    parsed = true;
                    console.log(`  [M2] Row ${dataCounter}: SPM="${spmNumber}" Keg="${kegiatan.substring(0, 35)}..." Amt=${anggaran}`);
                }
            }
        }

        // === METHOD 3: Fuzzy single-line parsing (fallback agresif) ===
        if (!parsed) {
            // Coba cari nomor SPM di mana saja dalam baris
            const spmMatch = line.match(/(\d{3,}\/\d{1,}\/[^\s]{1,}(?:\/\d{2,4})?)/);
            // Coba cari nominal anggaran di mana saja
            const amountMatch = line.match(/((?:\d{1,3}\.)*\d{1,3}(?:,\d+)?)/g);

            if (spmMatch || (amountMatch && amountMatch.some(a => parseAmount(a) > 10000))) {
                // Cari nomor urut di awal
                const noMatch = line.match(/^(\d{1,3})[\.\s]/);
                if (noMatch) no = parseInt(noMatch[1]);

                if (spmMatch) spmNumber = validateSpmNumber(spmMatch[1]);

                // Ambil angka terbesar sebagai anggaran
                if (amountMatch) {
                    const amounts = amountMatch.map(a => parseAmount(a)).filter(a => a > 0);
                    if (amounts.length > 0) {
                        anggaran = Math.max(...amounts);
                    }
                }

                // Sisa teks = kegiatan (rudimentary)
                let kegText = line;
                if (noMatch) kegText = kegText.replace(noMatch[0], '');
                if (spmMatch) kegText = kegText.replace(spmMatch[0], '');
                if (amountMatch) {
                    // Hapus angka terbesar dari teks
                    amountMatch.forEach(a => {
                        if (parseAmount(a) === anggaran) {
                            kegText = kegText.replace(a, '');
                        }
                    });
                }
                kegiatan = kegText.replace(/\s{2,}/g, ' ').trim();

                // Cek keterangan
                const ketMatch = kegiatan.match(/\b(ADD|BL|BT|BTL|TU|LS|GU|SPP)\b/i);
                if (ketMatch) {
                    keterangan = ketMatch[1].toUpperCase();
                    kegiatan = kegiatan.replace(ketMatch[0], '').trim();
                }

                if (spmNumber.length > 3 || kegiatan.length > 3 || anggaran > 10000) {
                    parsed = true;
                    console.log(`  [M3] Row ${dataCounter}: SPM="${spmNumber}" Keg="${kegiatan.substring(0, 35)}..." Amt=${anggaran}`);
                }
            }
        }

        // === SIMPAN HASIL ===
        if (parsed) {
            if (!no) no = dataCounter;

            // Heuristic validation: koreksi anggaran yang terlalu kecil
            // (kemungkinan OCR salah baca titik ribuan)
            if (anggaran > 0 && anggaran < 10000 && kegiatan.length > 5) {
                console.log(`  [WARN] Anggaran suspiciously low: Rp ${anggaran} — mungkin salah baca OCR`);
            }

            totalBudget += anggaran;
            dataSPM.push({
                no,
                nomor_spm: spmNumber,
                kegiatan,
                anggaran,
                keterangan: keterangan || ''
            });
            dataCounter++;
        } else {
            // Log baris yang gagal di-parse
            if (line.length > 10 && headerFound) {
                console.log(`  [SKIP] Tidak terparsing: "${line.substring(0, 60)}..."`);
            }
        }
    }

    if (!headerFound) {
        console.log('[PARSER] ⚠ HEADER TABEL TIDAK TERDETEKSI — mencoba parsing tanpa header...');
        // Fallback: parse semua baris yang mengandung pola SPM atau angka besar
        return parseTableWithoutHeader(textLines);
    }

    console.log(`[PARSER] Selesai. ${dataSPM.length} entri, Total: Rp ${totalBudget.toLocaleString('id-ID')}`);
    return { dataSPM, totalBudget };
};

/**
 * Fallback parser: extract data tanpa header terdeteksi
 * Mencari baris-baris yang mengandung pola nomor SPM atau nominal anggaran
 */
const parseTableWithoutHeader = (textLines) => {
    console.log('[PARSER-FALLBACK] Parsing tanpa deteksi header...');
    const dataSPM = [];
    let totalBudget = 0;
    let dataCounter = 1;

    for (const rawLine of textLines) {
        const line = correctOcrText(rawLine);
        if (line.length < 10) continue;

        // Skip header-like / footer-like rows
        const ll = line.toLowerCase();
        if (ll.includes('jumlah') || ll.includes('total') || ll.includes('demikian') ||
            ll.includes('nomor spm') || ll.includes('kegiatan') || ll.includes('anggaran')) continue;

        // Cari pola: nomor SPM (xxx/xx/xxx) DAN angka besar
        const spmMatch = line.match(/(\d{2,}\/\d+\/[^\s]+)/);
        const amounts = (line.match(/((?:\d{1,3}\.)*\d{1,3}(?:,\d+)?)/g) || [])
            .map(a => parseAmount(a))
            .filter(a => a > 10000);

        if (spmMatch || amounts.length > 0) {
            const spmNumber = spmMatch ? validateSpmNumber(spmMatch[1]) : '';
            const anggaran = amounts.length > 0 ? Math.max(...amounts) : 0;

            let kegiatan = line;
            if (spmMatch) kegiatan = kegiatan.replace(spmMatch[0], '');

            // Hapus angka-angka besar
            const allAmountMatches = line.match(/((?:\d{1,3}\.)*\d{1,3}(?:,\d+)?)/g) || [];
            allAmountMatches.forEach(a => {
                if (parseAmount(a) === anggaran) kegiatan = kegiatan.replace(a, '');
            });

            // Hapus nomor urut di awal
            kegiatan = kegiatan.replace(/^\d{1,3}[\.\s]+/, '');
            kegiatan = kegiatan.replace(/\s{2,}/g, ' ').trim();

            // Cari keterangan
            let keterangan = '';
            const ketMatch = kegiatan.match(/\b(ADD|BL|BT|BTL|TU|LS|GU|SPP)\b/i);
            if (ketMatch) {
                keterangan = ketMatch[1].toUpperCase();
                kegiatan = kegiatan.replace(ketMatch[0], '').trim();
            }

            if (spmNumber || kegiatan.length > 3 || anggaran > 0) {
                totalBudget += anggaran;
                dataSPM.push({
                    no: dataCounter++,
                    nomor_spm: spmNumber,
                    kegiatan,
                    anggaran,
                    keterangan
                });
            }
        }
    }

    console.log(`[PARSER-FALLBACK] ${dataSPM.length} entri ditemukan`);
    return { dataSPM, totalBudget };
};

// ======================== MAIN CONTROLLER ========================

exports.parseImage = async (req, res) => {
    console.log('\n========================================');
    console.log('=== OCR IMAGE PARSE REQUEST (v2.0) ===');
    console.log('========================================');
    console.log('Time:', new Date().toISOString());
    console.log('req.file:', req.file);

    if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log('Processing image at:', filePath);

    try {
        // ============================================
        // STEP 1: ADVANCED PRE-PROCESSING
        // ============================================
        const { bestBinarized, bestThreshold, softVariant, originalGrayscale, originalMetadata, scaleFactor } =
            await preprocessImage(filePath);

        // ============================================
        // STEP 2: MULTI-PASS OCR (Different strategies)
        // ============================================
        // Pass 1: Borderless binarized + PSM 6 (single block, line-by-line)
        console.log('\n[PASS 1] Borderless binarized + PSM 6 (threshold=' + bestThreshold + ')...');
        let ocrResult = await runOcr(bestBinarized, 'PASS1', {
            tessedit_pageseg_mode: '6'
        });
        let bestText = ocrResult.text;
        let bestConfidence = ocrResult.confidence || 0;

        // Pass 2: Soft variant (borderless grayscale) + PSM 4 (single column)
        if (bestConfidence < 60) {
            console.log(`\n[PASS 2] Confidence ${bestConfidence.toFixed(1)}% < 60%, mencoba soft + PSM 4...`);
            const ocrResult2 = await runOcr(softVariant, 'PASS2', {
                tessedit_pageseg_mode: '4'
            });
            if ((ocrResult2.confidence || 0) > bestConfidence) {
                console.log(`[PASS 2] Lebih baik! ${ocrResult2.confidence?.toFixed(1)}%`);
                bestText = ocrResult2.text;
                bestConfidence = ocrResult2.confidence || 0;
                ocrResult = ocrResult2;
            }
        }

        // Pass 3: Original grayscale WITH borders + PSM 6
        // (kadang border justru membantu Tesseract mengenali struktur)
        if (bestConfidence < 50) {
            console.log(`\n[PASS 3] Confidence ${bestConfidence.toFixed(1)}% < 50%, mencoba original+border + PSM 6...`);
            const ocrResult3 = await runOcr(originalGrayscale, 'PASS3', {
                tessedit_pageseg_mode: '6'
            });
            if ((ocrResult3.confidence || 0) > bestConfidence) {
                console.log(`[PASS 3] Original with borders lebih baik! ${ocrResult3.confidence?.toFixed(1)}%`);
                bestText = ocrResult3.text;
                bestConfidence = ocrResult3.confidence || 0;
                ocrResult = ocrResult3;
            }

            // Pass 4: PSM 3 (fully automatic) sebagai last resort
            if (bestConfidence < 40) {
                console.log(`\n[PASS 4] Last resort: PSM 3 (auto) pada original...`);
                const ocrResult4 = await runOcr(originalGrayscale, 'PASS4', {
                    tessedit_pageseg_mode: '3'
                });
                if ((ocrResult4.confidence || 0) > bestConfidence) {
                    console.log(`[PASS 4] PSM Auto lebih baik! ${ocrResult4.confidence?.toFixed(1)}%`);
                    bestText = ocrResult4.text;
                    bestConfidence = ocrResult4.confidence || 0;
                    ocrResult = ocrResult4;
                }
            }
        }

        console.log(`\n[FINAL OCR] Best confidence: ${bestConfidence.toFixed(1)}%`);
        console.log('--- RAW OCR TEXT ---');
        console.log(bestText);
        console.log('--- END RAW TEXT ---');

        // ============================================
        // STEP 3: TABLE PARSING
        // ============================================
        const { dataSPM, totalBudget } = parseTableFromOcrText(bestText);

        // ============================================
        // STEP 4: POST-PROCESSING / HEURISTIC VALIDATION
        // ============================================
        console.log('\n[VALIDATION] Post-processing heuristik...');
        dataSPM.forEach((entry, idx) => {
            // Validasi: nomor SPM harus mengandung setidaknya satu "/"
            if (entry.nomor_spm && !entry.nomor_spm.includes('/')) {
                console.log(`  [FIX] Row ${idx + 1}: SPM "${entry.nomor_spm}" tidak valid (no slash), reset`);
                // Pindahkan ke kegiatan jika bukan angka murni
                if (!/^\d+$/.test(entry.nomor_spm)) {
                    entry.kegiatan = (entry.nomor_spm + ' ' + entry.kegiatan).trim();
                }
                entry.nomor_spm = '';
            }

            // Validasi: anggaran tidak boleh negatif
            if (entry.anggaran < 0) entry.anggaran = 0;

            // Re-number
            entry.no = idx + 1;
        });

        console.log(`\n[DONE] ${dataSPM.length} entri ditemukan. Total: Rp ${totalBudget.toLocaleString('id-ID')}`);
        console.log(`[DONE] OCR confidence: ${bestConfidence.toFixed(1)}%`);
        console.log(`[DONE] Threshold used: ${bestThreshold}`);

        // Bersihkan file upload
        try { fs.unlinkSync(filePath); } catch (err) {
            console.error('Error deleting temp file:', err);
        }

        res.json({
            metadata: { desa: "", nomorSurat: "" },
            data: {
                activities: dataSPM,
                totalBudget: totalBudget
            },
            ocrRawText: bestText,
            ocrConfidence: bestConfidence,
            processingInfo: {
                threshold: bestThreshold,
                scaleFactor: scaleFactor.toFixed(2),
                originalSize: `${originalMetadata.width}x${originalMetadata.height}`,
                passes: bestConfidence < 40 ? 4 : bestConfidence < 50 ? 3 : bestConfidence < 60 ? 2 : 1
            }
        });

    } catch (error) {
        console.error('Error processing image:', error);
        try { fs.unlinkSync(filePath); } catch (e) { }
        res.status(500).json({
            error: 'Gagal memproses gambar: ' + error.message,
            details: error.stack
        });
    }
};

// ============================================================
// EXCEL PARSING
// ============================================================

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
