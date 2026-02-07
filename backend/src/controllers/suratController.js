const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllSurat = async (req, res) => {
    try {
        const surat = await prisma.surat.findMany({
            include: { desa: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(surat);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data surat" });
    }
};

exports.createSurat = async (req, res) => {
    const { nomor, perihal, tanggal, desaId, anggaran } = req.body;
    try {
        const newSurat = await prisma.surat.create({
            data: {
                nomor,
                perihal,
                tanggal: new Date(tanggal),
                desaId: parseInt(desaId),
                // Note: 'anggaran' field needs to be added to schema if you want to store it
            }
        });
        res.status(201).json(newSurat);
    } catch (error) {
        res.status(500).json({ error: "Gagal membuat surat: " + error.message });
    }
};

exports.getSuratByDesa = async (req, res) => {
    const { desaId } = req.params;
    try {
        const surat = await prisma.surat.findMany({
            where: { desaId: parseInt(desaId) },
            include: { desa: true }
        });
        res.json(surat);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil surat dari desa tersebut" });
    }
};
