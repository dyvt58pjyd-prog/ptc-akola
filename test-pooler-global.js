const { PrismaClient } = require('@prisma/client');

async function testConnection(url, name) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  try {
    await prisma.user.count();
    console.log(`✅ SUCCESS: ${name}`);
  } catch (e) {
    console.error(`❌ FAILED: ${name}`);
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const urls = [
    { name: "Global Pooler 6543", url: "postgresql://postgres.cbnfehbrcnrzeavdjbis:Anurag268724@pooler.supabase.com:6543/postgres?pgbouncer=true" },
    { name: "Global Pooler 5432", url: "postgresql://postgres.cbnfehbrcnrzeavdjbis:Anurag268724@pooler.supabase.com:5432/postgres" },
  ];

  for (const item of urls) {
    await testConnection(item.url, item.name);
  }
}

run();
