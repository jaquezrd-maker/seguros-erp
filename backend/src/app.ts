import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/errorHandler.middleware'
// import { initializeTenantMiddleware } from './middleware/tenant-isolation.middleware'
// import { cleanupTenantContext } from './middleware/auth.middleware'

// Initialize Prisma tenant isolation middleware BEFORE creating Express app
// This registers the Prisma middleware that will auto-filter queries
// initializeTenantMiddleware() // TODO: Uncomment when multi-tenant is ready

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
import eventRoutes from './modules/events/events.routes'
import taskRoutes from './modules/tasks/tasks.routes'
import testRoutes from './routes/test.routes'
import clientPortalRoutes from './modules/client-portal/client-portal.routes'
import portalDataRoutes from './modules/client-portal-data/portal-data.routes'
// import companiesRoutes from './modules/companies/companies.routes' // TODO: Multi-tenant feature
// import permissionsRoutes from './modules/permissions/permissions.routes' // TODO: Multi-tenant feature

const app = express()

// Security
app.use(helmet())

// CORS configuration - allow Vercel deployments and localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'https://seguros.dopek.net',
  'http://seguros.dopek.net',
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    // Allow localhost
    if (allowedOrigins.includes(origin)) return callback(null, true)

    // Allow any Vercel deployment
    if (origin.includes('.vercel.app')) return callback(null, true)

    // Allow custom domains from env var (both HTTP and HTTPS)
    if (process.env.FRONTEND_URL) {
      const frontendUrl = process.env.FRONTEND_URL
      const frontendUrlHttp = frontendUrl.replace('https://', 'http://')
      const frontendUrlHttps = frontendUrl.replace('http://', 'https://')

      if (origin === frontendUrl || origin === frontendUrlHttp || origin === frontendUrlHttps) {
        return callback(null, true)
      }
    }

    // Reject other origins
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400, // 24 hours
}))

// Handle OPTIONS preflight requests explicitly
app.options('*', cors())

// Rate limiting - generous limits for development
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // increased from 100 to 1000 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))

// Tenant context cleanup (clear after each request completes)
// app.use(cleanupTenantContext) // TODO: Uncomment when multi-tenant is ready

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
// app.use('/api/companies', companiesRoutes) // TODO: Multi-tenant feature
app.use('/api/client-portal', clientPortalRoutes)
app.use('/api/client-portal-data', portalDataRoutes)
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
app.use('/api/events', eventRoutes)
app.use('/api/tasks', taskRoutes)
// app.use('/api/permissions', permissionsRoutes) // TODO: Multi-tenant feature
app.use('/api/test', testRoutes)

// Error handler (must be last)
app.use(errorHandler)

export default app
