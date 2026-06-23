const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!user) {
      console.log("ERROR: Admin user not found in DB!");
      return;
    }

    console.log("User found:", user.username, "Role:", user.role);

    const match = await bcrypt.compare('admin123', user.password);
    console.log("Password match?", match);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
