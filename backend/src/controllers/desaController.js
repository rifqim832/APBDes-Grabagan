const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/villages - Get all villages
exports.getAllVillages = async (req, res) => {
    try {
        const villages = await prisma.village.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(villages);
    } catch (error) {
        console.error("Error fetching villages:", error);
        res.status(500).json({ error: "Gagal mengambil data desa" });
    }
};

// GET /api/villages/:id - Get village by ID
exports.getVillageById = async (req, res) => {
    const { id } = req.params;
    try {
        const village = await prisma.village.findUnique({
            where: { id: parseInt(id) },
            include: {
                incomingLetters: true,
                outgoingLetters: true
            }
        });
        if (!village) return res.status(404).json({ error: "Desa tidak ditemukan" });
        res.json(village);
    } catch (error) {
        console.error("Error fetching village:", error);
        res.status(500).json({ error: "Gagal mengambil data desa" });
    }
};

// PUT /api/villages/:id - Update village data (headName, address, email)
exports.updateVillage = async (req, res) => {
    const { id } = req.params;
    const { headName, address, email } = req.body;
    try {
        const village = await prisma.village.update({
            where: { id: parseInt(id) },
            data: {
                ...(headName !== undefined && { headName }),
                ...(address !== undefined && { address }),
                ...(email !== undefined && { email })
            }
        });
        res.json(village);
    } catch (error) {
        console.error("Error updating village:", error);
        res.status(500).json({ error: "Gagal memperbarui data desa" });
    }
};
