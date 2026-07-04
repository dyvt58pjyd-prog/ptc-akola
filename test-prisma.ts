const { prisma } = require('./src/lib/prisma.ts');

async function main() {
  console.log("Connecting to database using custom prisma.ts...");
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Success! Found users:", users.length);
  } catch (error) {
    console.error("Error connecting:", error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
