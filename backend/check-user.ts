import 'dotenv/config'
import prisma from './src/config/database'

async function checkUser() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@corredora.com.do' },
    include: {
      companies: {
        include: { company: true }
      }
    }
  })
  console.log('User structure:')
  console.log(JSON.stringify(user, null, 2))
}

checkUser().finally(() => process.exit(0))
