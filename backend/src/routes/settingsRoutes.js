const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ============================================================
// GET /api/settings/backup - Download full database backup as JSON
// ============================================================
router.get('/backup', async (req, res) => {
    try {
        // Export all tables
        const [villages, officials, users, incomingLetters, outgoingLetters, spmEntries, villagePagu] = await Promise.all([
            prisma.village.findMany({ orderBy: { id: 'asc' } }),
            prisma.official.findMany(),
            prisma.user.findMany({
                select: { id: true, username: true, name: true, role: true, createdAt: true }
                // Exclude password hash for security
            }),
            prisma.incomingLetter.findMany({ orderBy: { receivedDate: 'desc' } }),
            prisma.outgoingLetter.findMany({
                include: { spmEntries: { orderBy: { indexNo: 'asc' } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.spmEntry.findMany({ orderBy: { id: 'asc' } }),
            prisma.villagePagu.findMany({ orderBy: { id: 'asc' } })
        ]);

        const backup = {
            metadata: {
                appName: "SMART-APBDes Kecamatan Grabagan",
                backupDate: new Date().toISOString(),
                version: "1.0.0",
                totalRecords: {
                    villages: villages.length,
                    officials: officials.length,
                    users: users.length,
                    incomingLetters: incomingLetters.length,
                    outgoingLetters: outgoingLetters.length,
                    spmEntries: spmEntries.length,
                    villagePagu: villagePagu.length
                }
            },
            data: {
                villages,
                officials,
                users,
                incomingLetters,
                outgoingLetters,
                spmEntries,
                villagePagu
            }
        };

        // Set headers for file download
        const filename = `backup_smart_apbdes_grabagan_${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        res.json(backup);
    } catch (error) {
        console.error("Backup error:", error);
        res.status(500).json({ error: "Gagal membuat backup: " + error.message });
    }
});

// ============================================================
// GET /api/settings/stats - Database statistics for settings page
// ============================================================
router.get('/stats', async (req, res) => {
    try {
        const [villageCount, officialCount, userCount, incomingCount, outgoingCount, spmCount, paguCount] = await Promise.all([
            prisma.village.count(),
            prisma.official.count(),
            prisma.user.count(),
            prisma.incomingLetter.count(),
            prisma.outgoingLetter.count(),
            prisma.spmEntry.count(),
            prisma.villagePagu.count()
        ]);

        // Get database file size (SQLite)
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(__dirname, '../../prisma/dev.db');
        let dbSize = 0;
        try {
            const stats = fs.statSync(dbPath);
            dbSize = stats.size;
        } catch (e) {
            // Ignore if file not found
        }

        res.json({
            counts: {
                villages: villageCount,
                officials: officialCount,
                users: userCount,
                incomingLetters: incomingCount,
                outgoingLetters: outgoingCount,
                spmEntries: spmCount,
                villagePagu: paguCount
            },
            dbSize,
            dbSizeFormatted: formatBytes(dbSize)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
