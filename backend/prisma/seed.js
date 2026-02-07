const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const villages = [
    { nama: "Banyubang", kode: "414.420.05" },
    { nama: "Dahor", kode: "414.420.06" },
    { nama: "Dermawuharjo", kode: "414.420.08" },
    { nama: "Gesikan", kode: "414.420.02" },
    { nama: "Grabagan", kode: "414.420.01" },
    { nama: "Menyunyur", kode: "414.420.09" },
    { nama: "Ngandong", kode: "414.420.03" },
    { nama: "Ngarum", kode: "414.420.10" },
    { nama: "Ngrejeng", kode: "414.420.11" },
    { nama: "Pakis", kode: "414.420.07" },
    { nama: "Waleran", kode: "414.420.04" }
];

async function main() {
    console.log('Seeding data...');
    for (const village of villages) {
        const desa = await prisma.desa.upsert({
            where: { nama: village.nama },
            update: {},
            create: village,
        });
        console.log(`Created desa: ${desa.nama}`);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
