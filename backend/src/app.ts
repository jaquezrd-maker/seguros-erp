import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/errorHandler.middleware'

// Route imports
import authRoutes from './modules/auth/auth.routes'
import clientRoutes from './modules/clients/clients.routes'
import insurerRoutes from './modules/insurers/insurers.routes'
import policyRoutes from './modules/policies/policies.routes'
import claimRoutes from './modules/claims/claims.routes'
import paymentRoutes from './modules/payments/payments.routes'
import commissionRoutes from './modules/commissions/commissions.routes'
import renewalRoutes from './modules/renewals/renewals.routes'
import userRoutes from './modules/users/users.routes'
import reportRoutes from './modules/reports/reports.routes'
import insuranceTypeRoutes from './modules/insurance-types/insuranceTypes.routes'
import notificationRoutes from './modules/notifications/notifications.routes'
import aiRoutes from './modules/ai/ai.routes'
import testRoutes from './routes/test.routes'

const app = express()

// Security
app.use(helmet())

// CORS configuration - allow Vercel deployments and localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    // Allow localhost
    if (allowedOrigins.includes(origin)) return callback(null, true)

    // Allow any Vercel deployment
    if (origin.includes('.vercel.app')) return callback(null, true)

    // Allow custom domains from env var
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true)
    }

    // Reject other origins
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/insurers', insurerRoutes)
app.use('/api/policies', policyRoutes)
app.use('/api/claims', claimRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/commissions', commissionRoutes)
app.use('/api/renewals', renewalRoutes)
app.use('/api/users', userRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/insurance-types', insuranceTypeRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/test', testRoutes)

// Error handler (must be last)
app.use(errorHandler)

export default app
