import { PrismaClient } from '@prisma/client'
import { supabaseAdmin } from '../src/config/supabase'

const prisma = new PrismaClient()

async function createAdmin() {
  console.log('👤 Creating admin user...')

  try {
    let supabaseUserId: string

    // 1. Try to find existing Supabase Auth user
    console.log('Checking if user exists in Supabase Auth...')
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === 'admin@corredora.com.do')

    if (existingUser) {
      console.log('✓ Found existing Supabase Auth user')
      supabaseUserId = existingUser.id

      // Update password to ensure it's correct
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: 'Admin123!' }
      )

      if (updateError) {
        console.warn('Warning: Could not update password:', updateError.message)
      } else {
        console.log('✓ Password updated')
      }
    } else {
      // Create new user in Supabase Auth
      console.log('Creating new Supabase Auth user...')
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@corredora.com.do',
        password: 'Admin123!',
        email_confirm: true,
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        throw authError
      }

      supabaseUserId = authUser.user.id
      console.log('✓ Created Supabase Auth user')
    }

    // 2. Check if user already exists in database
    const existingDbUser = await prisma.user.findUnique({
      where: { supabaseUserId },
    })

    if (existingDbUser) {
      console.log('✓ User already exists in database')
      console.log('\n✅ Admin user ready!')
    } else {
      // Create user in database
      await prisma.user.create({
        data: {
          supabaseUserId,
          name: 'Emmanuel Admin',
          email: 'admin@corredora.com.do',
          role: 'ADMINISTRADOR',
          status: 'ACTIVO',
        },
      })
      console.log('✓ Created database user')
      console.log('\n✅ Admin user created successfully!')
    }

    console.log('\n📧 Login credentials:')
    console.log('   Email: admin@corredora.com.do')
    console.log('   Password: Admin123!')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
