import prisma from '../src/config/database'
import { CommissionsService } from '../src/modules/commissions/commissions.service'

async function generateRetroactiveCommissions() {
  console.log('🔄 Generating retroactive commissions for completed payments...')

  const commissionsService = new CommissionsService()

  // Get all completed payments that don't have associated commissions yet
  const completedPayments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETADO',
    },
    include: {
      policy: {
        include: {
          insurer: true,
          insuranceType: true,
        },
      },
    },
    orderBy: {
      paymentDate: 'asc',
    },
  })

  console.log(`Found ${completedPayments.length} completed payments`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const payment of completedPayments) {
    try {
      if (!payment.policy) {
        console.log(`⚠️  Payment ${payment.id} has no associated policy, skipping`)
        skipped++
        continue
      }

      if (!payment.policy.createdBy) {
        console.log(`⚠️  Policy ${payment.policy.policyNumber} has no producer assigned, skipping`)
        skipped++
        continue
      }

      // Check if commission already exists for this payment
      const existingCommission = await prisma.commission.findFirst({
        where: {
          policyId: payment.policyId,
          producerId: payment.policy.createdBy,
          premiumAmount: payment.amount,
        },
      })

      if (existingCommission) {
        console.log(`✓ Commission already exists for payment ${payment.id}, skipping`)
        skipped++
        continue
      }

      // Generate period from payment date
      const paymentDate = new Date(payment.paymentDate)
      const period = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`

      // Generate commission
      const commission = await commissionsService.generateFromPayment(
        payment.policyId!,
        Number(payment.amount),
        period
      )

      if (commission) {
        console.log(`✅ Created commission for payment ${payment.id} (${payment.policy.policyNumber}) - ${payment.amount} @ ${commission.rate}% = ${commission.amount}`)
        created++
      } else {
        console.log(`⚠️  No commission rule found for payment ${payment.id} (${payment.policy.policyNumber})`)
        skipped++
      }
    } catch (error: any) {
      console.error(`❌ Error processing payment ${payment.id}:`, error.message)
      errors++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`  ✅ Created: ${created}`)
  console.log(`  ⚠️  Skipped: ${skipped}`)
  console.log(`  ❌ Errors: ${errors}`)
  console.log(`  📋 Total: ${completedPayments.length}`)
}

generateRetroactiveCommissions()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
