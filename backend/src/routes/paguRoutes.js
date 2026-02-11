const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ============================================================
// GET /api/pagu/monitoring/:year - Monitoring Realisasi Anggaran
// HARUS di atas /:year agar tidak tertangkap oleh parameter route
// ============================================================
router.get('/monitoring/:year', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

        const villages = await prisma.village.findMany({
            include: {
                paguHistory: {
                    where: { year }
                },
                outgoingLetters: {
                    where: {
                        letterDate: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    include: {
                        spmEntries: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        const result = villages.map(v => {
            const pagu = v.paguHistory[0]?.amount || 0;
            const totalRealisasi = v.outgoingLetters.reduce(
                (sum, letter) => sum + (letter.totalBudget || 0), 0
            );
            const sisa = pagu - totalRealisasi;
            const persentase = pagu > 0 ? (totalRealisasi / pagu) * 100 : 0;
            const jumlahSurat = v.outgoingLetters.length;

            return {
                villageId: v.id,
                namaDesa: v.name,
                kodeDesa: v.villageCode,
                pagu,
                realisasi: totalRealisasi,
                sisa,
                persentase: parseFloat(persentase.toFixed(2)),
                jumlahSurat
            };
        });

        const grandTotal = {
            totalPagu: result.reduce((s, r) => s + r.pagu, 0),
            totalRealisasi: result.reduce((s, r) => s + r.realisasi, 0),
            totalSisa: result.reduce((s, r) => s + r.sisa, 0),
            totalSurat: result.reduce((s, r) => s + r.jumlahSurat, 0)
        };
        grandTotal.persentase = grandTotal.totalPagu > 0
            ? parseFloat(((grandTotal.totalRealisasi / grandTotal.totalPagu) * 100).toFixed(2))
            : 0;

        res.json({ villages: result, grandTotal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// POST /api/pagu - Upsert pagu (buat baru / update)
// ============================================================
router.post('/', async (req, res) => {
    try {
        const { villageId, year, amount } = req.body;
        const pagu = await prisma.villagePagu.upsert({
            where: {
                villageId_year: { villageId: parseInt(villageId), year: parseInt(year) }
            },
            update: { amount: parseFloat(amount) },
            create: {
                villageId: parseInt(villageId),
                year: parseInt(year),
                amount: parseFloat(amount)
            },
            include: { village: true }
        });
        res.json(pagu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET /api/pagu/:year - Ambil semua pagu desa di tahun tertentu
// HARUS di bawah /monitoring/:year
// ============================================================
router.get('/:year', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const paguList = await prisma.villagePagu.findMany({
            where: { year },
            include: { village: true },
            orderBy: { village: { name: 'asc' } }
        });
        res.json(paguList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
