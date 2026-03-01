import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Delete existing demo user if exists (idempotent seed)
  await prisma.user.deleteMany({
    where: { email: 'admin@cyberlog.com' }
  })

  const passwordHash = await bcrypt.hash('password123', 12)

  const user = await prisma.user.create({
    data: {
      email: 'admin@cyberlog.com',
      passwordHash,
    }
  })

  console.log('✅ Seed complete. Demo user created:')
  console.log('   Email:    admin@cyberlog.com')
  console.log('   Password: password123')
  console.log('   ID:       ', user.id)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
