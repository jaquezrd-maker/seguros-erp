import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const users = await prisma.user.findMany()
    console.log(`\nUsuarios en la base de datos: ${users.length}`)

    users.forEach(u => {
      console.log(`  - ${u.email} (${u.role})`)
    })

    const admin = users.find(u => u.email === 'admin@corredora.com.do')

    if (admin) {
      console.log('\n✅ Usuario admin encontrado y activo')
      console.log('   Email: admin@corredora.com.do')
      console.log('   Password: Admin123!')
    } else {
      console.log('\n❌ Usuario admin NO encontrado')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
