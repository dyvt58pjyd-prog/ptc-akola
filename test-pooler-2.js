const { PrismaClient } = require('@prisma/client');

async function testConnection(url, name) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  try {
    await prisma.user.count();
    console.log(`✅ SUCCESS: ${name}`);
  } catch (e) {
    console.error(`❌ FAILED: ${name} -> ${e.message.split('\n')[0]}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const urls = [
    { name: "Screenshot DATABASE_URL", url: "postgresql://postgres.cbnfehbrcnrzeavdjbis:Anurag268724@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" },
    { name: "Screenshot DIRECT_URL", url: "postgresql://postgres.cbnfehbrcnrzeavdjbis:Anurag268724@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" }
  ];

  for (const item of urls) {
    await testConnection(item.url, item.name);
  }
}

run();
