import 'dotenv/config'
import prisma from './src/config/database'

async function upgradeAdmin() {
  const user = await prisma.user.update({
    where: { email: 'admin@corredora.com.do' },
    data: { role: 'SUPER_ADMIN' },
  })

  console.log('✅ Admin upgraded to SUPER_ADMIN:', user)
}

upgradeAdmin()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
