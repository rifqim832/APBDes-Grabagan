const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Villages:");
    const villages = await prisma.village.findMany();
    console.log(JSON.stringify(villages, null, 2));

    console.log("\nOutgoing Letters:");
    const letters = await prisma.outgoingLetter.findMany({
        include: { village: true }
    });
    console.log(JSON.stringify(letters.map(l => ({
        id: l.id,
        no: l.letterNo,
        date: l.letterDate,
        budget: l.totalBudget,
        village: l.village.name,
        villageId: l.villageId
    })), null, 2));

    console.log("\nChecking Pagu Routes logic for 2026:");
    const year = 2026;
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    console.log("Start:", startDate);
    console.log("End:", endDate);

    const check = await prisma.outgoingLetter.findMany({
        where: {
            letterDate: {
                gte: startDate,
                lte: endDate
            }
        }
    });
    console.log("Letters in 2026 found:", check.length);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
