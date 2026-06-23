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
    { name: "Pooler 6543 with project ID and SSL", url: "postgresql://postgres.cbnfehbrcnrzeavdjbis:Anurag268724@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require" },
    { name: "Pooler 6543 just postgres with SSL", url: "postgresql://postgres:Anurag268724@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require" },
    { name: "Pooler 6543 direct hostname", url: "postgresql://postgres:Anurag268724@pooler.cbnfehbrcnrzeavdjbis.supabase.com:6543/postgres?pgbouncer=true&sslmode=require" },
  ];

  for (const item of urls) {
    await testConnection(item.url, item.name);
  }
}

run();
