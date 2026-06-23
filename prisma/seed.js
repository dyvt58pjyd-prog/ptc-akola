const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created (admin / admin123)');

  // Create Officer
  const officerPassword = await bcrypt.hash('officer123', 10);
  await prisma.user.upsert({
    where: { username: 'officer' },
    update: {},
    create: {
      username: 'officer',
      password: officerPassword,
      role: 'OFFICER',
    },
  });
  console.log('Officer user created (officer / officer123)');

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
