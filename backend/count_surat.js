const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.surat.count();
    const last = await prisma.surat.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log(`Total Surat: ${count}`);
    if (last) console.log(`Last Surat: ${JSON.stringify(last)}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
