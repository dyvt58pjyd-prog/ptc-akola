const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = process.env.DATABASE_POSTGRES_URL_NON_POOLING || "postgresql://neondb_owner:npg_N68WSDEJsVyX@ep-steep-sea-aidthhlm.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  console.log("Connecting with non-pooling URL...");
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
