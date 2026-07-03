import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const recruits = await prisma.recruit.findMany();
  
  let updatedCount = 0;
  for (const recruit of recruits) {
    const original = recruit.chestNumber;
    // Replace leading zeros followed by a digit. 
    // e.g. "01" -> "1", "001A" -> "1A", "00" -> "0"
    const cleaned = original.replace(/^0+(?=\d)/, '');
    
    if (original !== cleaned) {
      try {
        await prisma.recruit.update({
          where: { id: recruit.id },
          data: { chestNumber: cleaned }
        });
        console.log(`Updated ${original} to ${cleaned}`);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update ${original} to ${cleaned}:`, error);
      }
    }
  }
  console.log(`Finished updating ${updatedCount} recruits.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
