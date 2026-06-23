import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_N68WSDEJsVyX@ep-steep-sea-aidthhlm-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
