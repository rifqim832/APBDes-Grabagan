const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// SURAT KELUAR (Outgoing Letters)
// ============================================================

// GET /api/surat/keluar - Get all outgoing letters
exports.getAllOutgoing = async (req, res) => {
    try {
        const letters = await prisma.outgoingLetter.findMany({
            include: {
                village: true,
                spmEntries: true,
                incomingLetter: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(letters);
    } catch (error) {
        console.error("Error fetching outgoing letters:", error);
        res.status(500).json({ error: "Gagal mengambil data surat keluar" });
    }
};

// GET /api/surat/keluar/:id - Get single outgoing letter with details
exports.getOutgoingById = async (req, res) => {
    const { id } = req.params;
    try {
        const letter = await prisma.outgoingLetter.findUnique({
            where: { id },
            include: {
                village: true,
                spmEntries: { orderBy: { indexNo: 'asc' } },
                incomingLetter: true
            }
        });
        if (!letter) return res.status(404).json({ error: "Surat keluar tidak ditemukan" });
        res.json(letter);
    } catch (error) {
        console.error("Error fetching outgoing letter:", error);
        res.status(500).json({ error: "Gagal mengambil data surat keluar" });
    }
};

// POST /api/surat/create - Create both incoming + outgoing letters + SPM entries (Transactional)
exports.createLetters = async (req, res) => {
    const {
        // Incoming letter data
        referenceNo,    // Nomor surat masuk dari desa
        // Outgoing letter data
        letterNo,       // Nomor surat keluar (outgoing, e.g. "001")
        subject,        // Perihal
        letterDate,     // Tanggal surat
        villageId,      // ID Desa
        totalBudget,    // Total anggaran
        // SPM entries
        activities      // Array of { no, nomor_spm, kegiatan, anggaran, keterangan }
    } = req.body;

    console.log("createLetters req.body:", JSON.stringify(req.body, null, 2));

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Surat Masuk
            const incoming = await tx.incomingLetter.create({
                data: {
                    referenceNo: referenceNo || "",
                    letterDate: new Date(letterDate),
                    totalBudget: totalBudget ? Number(totalBudget) : 0,
                    villageId: parseInt(villageId)
                }
            });

            // 2. Create Surat Keluar linked to Surat Masuk
            const outgoing = await tx.outgoingLetter.create({
                data: {
                    letterNo: letterNo,
                    subject: subject || "",
                    letterDate: new Date(letterDate),
                    totalBudget: totalBudget ? Number(totalBudget) : 0,
                    villageId: parseInt(villageId),
                    incomingLetterId: incoming.id
                }
            });

            // 3. Create SPM Entries (detail baris tabel)
            if (activities && activities.length > 0) {
                const spmData = activities.map((act, index) => ({
                    indexNo: act.no || index + 1,
                    spmNo: act.nomor_spm || act.spmNo || "-",
                    activity: act.kegiatan || act.activity || "",
                    amount: Number(act.anggaran || act.amount || 0),
                    description: act.keterangan || act.description || "",
                    outgoingLetterId: outgoing.id
                }));

                await tx.spmEntry.createMany({ data: spmData });
            }

            return { incoming, outgoing };
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Create Letters Error:", error);
        res.status(500).json({ error: "Gagal membuat surat: " + error.message });
    }
};

// DELETE /api/surat/keluar/:id - Delete outgoing letter (cascades to SPM entries)
exports.deleteOutgoing = async (req, res) => {
    const { id } = req.params;
    try {
        // First get the outgoing letter to find the linked incoming letter
        const outgoing = await prisma.outgoingLetter.findUnique({ where: { id } });
        if (!outgoing) return res.status(404).json({ error: "Surat tidak ditemukan" });

        await prisma.$transaction([
            // SPM entries are cascade-deleted automatically
            prisma.outgoingLetter.delete({ where: { id } }),
            // Also delete the linked incoming letter
            prisma.incomingLetter.delete({ where: { id: outgoing.incomingLetterId } })
        ]);

        res.json({ message: "Surat berhasil dihapus" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Gagal menghapus surat: " + error.message });
    }
};

// ============================================================
// SURAT MASUK (Incoming Letters)
// ============================================================

// GET /api/surat/masuk - Get all incoming letters
exports.getAllIncoming = async (req, res) => {
    try {
        const letters = await prisma.incomingLetter.findMany({
            include: {
                village: true,
                outgoingLetter: {
                    include: {
                        spmEntries: { orderBy: { indexNo: 'asc' } }
                    }
                }
            },
            orderBy: { receivedDate: 'desc' }
        });
        res.json(letters);
    } catch (error) {
        console.error("Error fetching incoming letters:", error);
        res.status(500).json({ error: "Gagal mengambil data surat masuk" });
    }
};

// ============================================================
// UTILITIES
// ============================================================

// GET /api/surat/last-number - Get last outgoing letter number
exports.getLastLetterNumber = async (req, res) => {
    try {
        const lastLetter = await prisma.outgoingLetter.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        let nextNumber = 1;

        if (lastLetter && lastLetter.letterNo) {
            // letterNo is stored as "001", "002", etc.
            const parsed = parseInt(lastLetter.letterNo);
            if (!isNaN(parsed)) {
                nextNumber = parsed + 1;
            }
        }

        res.json({ nextNumber: String(nextNumber).padStart(3, '0') });
    } catch (error) {
        console.error("Error getting last letter number:", error);
        res.status(500).json({ error: "Gagal mengambil nomor surat terakhir" });
    }
};

// GET /api/surat/stats - Dashboard statistics
exports.getStats = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);

        const [totalIncoming, totalOutgoing, monthlyIncoming, monthlyOutgoing] = await Promise.all([
            prisma.incomingLetter.count({
                where: { receivedDate: { gte: startOfYear } }
            }),
            prisma.outgoingLetter.count({
                where: { createdAt: { gte: startOfYear } }
            }),
            prisma.incomingLetter.count({
                where: {
                    receivedDate: {
                        gte: new Date(currentYear, new Date().getMonth(), 1)
                    }
                }
            }),
            prisma.outgoingLetter.count({
                where: {
                    createdAt: {
                        gte: new Date(currentYear, new Date().getMonth(), 1)
                    }
                }
            })
        ]);

        res.json({
            totalIncoming,
            totalOutgoing,
            monthlyIncoming,
            monthlyOutgoing
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Gagal mengambil statistik" });
    }
};
