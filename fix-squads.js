const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recruits = await prisma.recruit.findMany({
    where: {
      squadNumber: { not: null }
    }
  });

  let updatedCount = 0;
  for (const r of recruits) {
    if (r.squadNumber.match(/^0+\d/)) {
      const newSquadNumber = r.squadNumber.replace(/^0+(?=\d)/, '');
      await prisma.recruit.update({
        where: { id: r.id },
        data: { squadNumber: newSquadNumber }
      });
      updatedCount++;
    }
  }
  console.log(`Updated ${updatedCount} recruits.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
