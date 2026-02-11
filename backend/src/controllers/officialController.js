const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/officials - Get the Camat data (always id: 1)
exports.getOfficial = async (req, res) => {
    try {
        let official = await prisma.official.findFirst();
        if (!official) {
            // Auto-create default if not exists
            official = await prisma.official.create({
                data: {
                    name: "H. SUWANTO, S.STP, M.M",
                    nip: "19780101 200501 1 012",
                    status: "Definitif",
                    title: "CAMAT GRABAGAN",
                    rank: "Pembina Tingkat I"
                }
            });
        }
        res.json(official);
    } catch (error) {
        console.error("Error fetching official:", error);
        res.status(500).json({ error: "Gagal mengambil data pejabat" });
    }
};

// PUT /api/officials/:id - Update Camat data
exports.updateOfficial = async (req, res) => {
    const { id } = req.params;
    const { name, nip, status, title, rank } = req.body;
    try {
        const official = await prisma.official.update({
            where: { id: parseInt(id) },
            data: {
                ...(name !== undefined && { name }),
                ...(nip !== undefined && { nip }),
                ...(status !== undefined && { status }),
                ...(title !== undefined && { title }),
                ...(rank !== undefined && { rank })
            }
        });
        res.json(official);
    } catch (error) {
        console.error("Error updating official:", error);
        res.status(500).json({ error: "Gagal memperbarui data pejabat" });
    }
};
