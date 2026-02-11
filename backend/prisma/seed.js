const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const villages = [
    { name: "Banyubang", villageCode: "414.420.05", headName: "", address: "Jalan Raya Banyubang No.79", email: "banyubangpemdes@gmail.com" },
    { name: "Dahor", villageCode: "414.420.06", headName: "", address: "Jalan Beji No.03 Dahor", email: "" },
    { name: "Dermawuharjo", villageCode: "414.420.08", headName: "", address: "Jalan Sekar Tanjung No.02", email: "" },
    { name: "Gesikan", villageCode: "414.420.02", headName: "", address: "Jalan Raya No 339 Desa Gesikan", email: "" },
    { name: "Grabagan", villageCode: "414.420.01", headName: "", address: "Jalan Raya Grabagan No.257", email: "pemdesgrabagan@gmail.com" },
    { name: "Menyunyur", villageCode: "414.420.09", headName: "", address: "Jalan Raya Sari Ngembat No.15", email: "pemdesmenyunyur9@gmail.com" },
    { name: "Ngandong", villageCode: "414.420.03", headName: "", address: "Jalan Raya Rellay TVRI", email: "" },
    { name: "Ngarum", villageCode: "414.420.10", headName: "", address: "Jalan Raya Ngarum Grabagan", email: "desangarum10@gmail.com" },
    { name: "Ngrejeng", villageCode: "414.420.11", headName: "", address: "Jalan Raya Ngrejeng Grabagan", email: "" },
    { name: "Pakis", villageCode: "414.420.07", headName: "", address: "Jalan Sendang Telo No.37", email: "" },
    { name: "Waleran", villageCode: "414.420.04", headName: "", address: "Jalan Raya Waleran", email: "pemdes.waleran@gmail.com" }
];

async function main() {
    console.log('Seeding data...');

    // Seed Users (Admin & Operator)
    const users = [
        { username: 'admin', password: 'admin123', name: 'Admin Kecamatan', role: 'STAFF' },
        { username: 'operator', password: 'operator123', name: 'Operator Kecamatan', role: 'OPERATOR' }
    ];

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        const user = await prisma.user.upsert({
            where: { username: u.username },
            update: { name: u.name, role: u.role },
            create: {
                username: u.username,
                password: hashedPassword,
                name: u.name,
                role: u.role
            }
        });
        console.log(`Created user: ${user.name} (${user.role}) - username: ${u.username}`);
    }

    // Seed Villages
    for (const village of villages) {
        const desa = await prisma.village.upsert({
            where: { name: village.name },
            update: { address: village.address, email: village.email },
            create: village,
        });
        console.log(`Created village: ${desa.name} (${desa.villageCode}) - ${desa.address}`);
    }

    // Seed Default Official (Camat)
    const official = await prisma.official.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: "H. SUWANTO, S.STP, M.M",
            nip: "19780101 200501 1 012",
            status: "Definitif",
            title: "CAMAT GRABAGAN",
            rank: "Pembina Tingkat I"
        }
    });
    console.log(`Created official: ${official.name} (${official.status})`);

    // Seed Pagu Dana Desa untuk TA 2026 (contoh data)
    const paguData = [
        { villageName: "Banyubang", amount: 1200000000 },      // 1.2 M
        { villageName: "Dahor", amount: 950000000 },           // 950 juta
        { villageName: "Dermawuharjo", amount: 1100000000 },   // 1.1 M
        { villageName: "Gesikan", amount: 1300000000 },        // 1.3 M
        { villageName: "Grabagan", amount: 1500000000 },       // 1.5 M
        { villageName: "Menyunyur", amount: 1050000000 },      // 1.05 M
        { villageName: "Ngandong", amount: 1250000000 },       // 1.25 M
        { villageName: "Ngarum", amount: 1150000000 },         // 1.15 M
        { villageName: "Ngrejeng", amount: 1000000000 },       // 1 M
        { villageName: "Pakis", amount: 1100000000 },          // 1.1 M
        { villageName: "Waleran", amount: 1200000000 }         // 1.2 M
    ];

    for (const pagu of paguData) {
        const village = await prisma.village.findUnique({ where: { name: pagu.villageName } });
        if (village) {
            await prisma.villagePagu.upsert({
                where: {
                    villageId_year: { villageId: village.id, year: 2026 }
                },
                update: { amount: pagu.amount },
                create: {
                    villageId: village.id,
                    year: 2026,
                    amount: pagu.amount
                }
            });
            console.log(`Created pagu for ${pagu.villageName}: Rp ${pagu.amount.toLocaleString('id-ID')}`);
        }
    }

    console.log('Seeding complete!');
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
