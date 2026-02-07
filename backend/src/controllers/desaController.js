const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllDesa = async (req, res) => {
    try {
        const desa = await prisma.desa.findMany();
        res.json(desa);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data desa" });
    }
};

exports.getDesaById = async (req, res) => {
    const { id } = req.params;
    try {
        const desa = await prisma.desa.findUnique({
            where: { id: parseInt(id) }
        });
        if (!desa) return res.status(404).json({ error: "Desa tidak ditemukan" });
        res.json(desa);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data desa" });
    }
};
