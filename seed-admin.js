const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword, role: 'ADMIN' },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user updated with correct role!', user.username, user.role);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
