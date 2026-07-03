import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.batch.findMany();
  
  if (batches.length !== 1) {
    console.log("Multiple or zero batches found, not updating automatically.");
    return;
  }
  
  const batchId = batches[0].id;
  const recruitsWithoutBatch = await prisma.recruit.findMany({ where: { batchId: null } });
  console.log('Recruits without batch:', recruitsWithoutBatch.length);
  
  for (const recruit of recruitsWithoutBatch) {
    try {
      await prisma.recruit.update({
        where: { id: recruit.id },
        data: { batchId: batchId }
      });
      console.log(`Updated recruit ${recruit.chestNumber} (${recruit.name})`);
    } catch (error) {
      console.log(`Conflict for recruit ${recruit.chestNumber} (${recruit.name}). Probably already exists in batch.`);
      // If it's a true duplicate (e.g. they registered twice without batch, and one was already moved, or they exist in batch)
      // let's see if we should delete the unassigned one, or leave it.
      // Usually, if a batch already has a recruit with that chestNumber, the one with batchId: null is a duplicate.
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
